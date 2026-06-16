/* eslint-disable */
const fs = require('fs');
const https = require('https');

// Configuration depuis les variables d'environnement
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // ex: "owner/repo"
const PR_NUMBER = process.env.GITHUB_PR_NUMBER;

if (!GITHUB_TOKEN || !GEMINI_API_KEY || !GITHUB_REPOSITORY || !PR_NUMBER) {
  console.error("Erreur: Variables d'environnement manquantes (GITHUB_TOKEN, GEMINI_API_KEY, GITHUB_REPOSITORY, GITHUB_PR_NUMBER).");
  process.exit(1);
}

// Configuration des extensions de fichiers à analyser
const SUPPORTED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx', '.py', '.sh', '.yml', '.yaml',
  '.json', '.css', '.html', '.go', '.rs', '.c', '.cpp', '.h',
  '.conf', '.ini', '.md'
];

// Fichiers à ignorer explicitement
const IGNORED_FILES = [
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'composer.lock',
  'AGENTS.md', 'task.md', 'implementation_plan.md', 'walkthrough.md'
];

// Fonction utilitaire pour faire des requêtes HTTPS asynchrones
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Status Code: ${res.statusCode}. Response: ${data}`));
        }
      });
    });

    req.on('error', (err) => { reject(err); });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// Fonction pour récupérer la liste des lignes ajoutées ou modifiées dans un patch
function getAddedLines(patch) {
  if (!patch) return [];
  const lines = patch.split('\n');
  const addedLines = [];
  let currentNewLineNum = 0;

  for (const line of lines) {
    const chunkHeader = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (chunkHeader) {
      currentNewLineNum = parseInt(chunkHeader[1], 10);
      continue;
    }

    if (line.startsWith('+')) {
      if (!line.startsWith('+++')) { // Éviter l'en-tête du fichier
        addedLines.push(currentNewLineNum);
      }
      currentNewLineNum++;
    } else if (line.startsWith('-')) {
      // Ligne supprimée (n'existe pas dans le nouveau fichier)
    } else {
      // Ligne inchangée
      currentNewLineNum++;
    }
  }
  return addedLines;
}

async function run() {
  try {
    console.log(`Démarrage de la revue IA pour la PR #${PR_NUMBER} du dépôt ${GITHUB_REPOSITORY}...`);

    // 1. Récupérer les détails de la PR (notamment pour avoir le SHA de commit de tête)
    console.log("Récupération des détails de la PR...");
    const prDetailsOptions = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-PR-Reviewer-Action'
      }
    };
    const prDetailsRaw = await makeRequest(prDetailsOptions);
    const prDetails = JSON.parse(prDetailsRaw);
    const commitSha = prDetails.head.sha;
    console.log(`SHA du dernier commit: ${commitSha}`);

    // 2. Récupérer les fichiers modifiés dans la PR
    console.log("Récupération des fichiers de la PR...");
    const prFilesOptions = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/files?per_page=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-PR-Reviewer-Action'
      }
    };
    const prFilesRaw = await makeRequest(prFilesOptions);
    const files = JSON.parse(prFilesRaw);

    // Filtrer les fichiers de code pertinents
    const filesToAnalyze = files.filter(file => {
      const isIgnored = IGNORED_FILES.some(ignored => file.filename.endsWith(ignored));
      if (isIgnored) return false;

      const isSupported = SUPPORTED_EXTENSIONS.some(ext => file.filename.endsWith(ext));
      const hasPatch = !!file.patch;
      return isSupported && hasPatch;
    });

    if (filesToAnalyze.length === 0) {
      console.log("Aucun fichier de code modifiable ou pertinent n'a été trouvé à analyser.");
      return;
    }

    console.log(`${filesToAnalyze.length} fichiers retenus pour analyse.`);

    // 3. Préparer les données pour Gemini
    const fileDiffData = filesToAnalyze.map(file => {
      const addedLines = getAddedLines(file.patch);
      return {
        filename: file.filename,
        patch: file.patch,
        validLinesForComments: addedLines
      };
    });

    // 4. Appeler l'API Gemini
    console.log("Envoi des modifications à l'API Gemini...");

    const systemInstruction = `Tu es un expert en revue de code (ingénieur logiciel principal). Ton rôle est d'analyser les modifications d'une Pull Request (les diffs fournis avec leurs patches) et de générer une revue technique constructive et précise.

Consignes impératives :
1. Tu dois analyser chaque fichier et générer des commentaires ciblés uniquement si cela est nécessaire (bugs, failles de sécurité, optimisations majeures de performance, mauvaise gestion d'erreurs, lisibilité).
2. Pour chaque commentaire, tu DOIS fournir un numéro de ligne ('line') qui fait partie de la liste des lignes valides ('validLinesForComments') fournie pour ce fichier. Ne commente jamais sur une ligne en dehors de cette liste, sinon l'API GitHub lèvera une erreur.
3. Rédige tes commentaires en français, de manière claire et technique. Tu peux proposer du code de correction sous forme de bloc de code markdown.
4. Rends ton verdict global dans le champ 'verdict' :
   - 'APPROVE' : Si le code est excellent et prêt à être fusionné (aucun commentaire requis).
   - 'COMMENT' : Si tu as des suggestions ou questions mineures mais non bloquantes.
   - 'REQUEST_CHANGES' : Si tu as trouvé des bugs sérieux, des failles de sécurité, ou des problèmes de performance bloquants.
5. Tu dois obligatoirement répondre en JSON respectant exactement le schéma suivant :
{
  "verdict": "APPROVE" | "COMMENT" | "REQUEST_CHANGES",
  "summary": "Résumé textuel global de ta revue.",
  "comments": [
    {
      "path": "chemin/du/fichier.js",
      "line": 42,
      "body": "Explication du problème ou suggestion de correction..."
    }
  ]
}`;

    const promptUser = `Voici les fichiers modifiés et leurs diffs pour la Pull Request #${PR_NUMBER}.
Analyse-les attentivement et génère ta revue de code structurée au format JSON.

Données de la Pull Request :
${JSON.stringify(fileDiffData, null, 2)}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptUser }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemInstruction }
        ]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const urlObj = new URL(geminiUrl);

    const geminiOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const geminiResponseRaw = await makeRequest(geminiOptions, geminiPayload);
    const geminiResponse = JSON.parse(geminiResponseRaw);

    // Extraire le texte de la réponse
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const reviewResult = JSON.parse(responseText);

    console.log(`Verdict de l'IA : ${reviewResult.verdict}`);
    console.log(`Résumé : ${reviewResult.summary}`);
    console.log(`Nombre de commentaires générés : ${reviewResult.comments ? reviewResult.comments.length : 0}`);

    // Filtrer les commentaires pour s'assurer qu'ils ciblent des lignes valides
    const validComments = [];
    if (reviewResult.comments && Array.isArray(reviewResult.comments)) {
      for (const comment of reviewResult.comments) {
        const fileData = fileDiffData.find(f => f.filename === comment.path);
        if (fileData) {
          if (fileData.validLinesForComments.includes(Number(comment.line))) {
            validComments.push({
              path: comment.path,
              line: Number(comment.line),
              side: 'RIGHT',
              body: comment.body
            });
          } else {
            console.warn(`Avertissement : L'IA a proposé un commentaire pour ${comment.path} à la ligne ${comment.line}, mais cette ligne n'est pas modifiée dans la PR. Commentaire ignoré.`);
          }
        }
      }
    }

    // 5. Soumettre la revue sur GitHub
    console.log("Publication de la revue sur GitHub...");
    const reviewPayload = {
      commit_id: commitSha,
      body: `### 🤖 Revue automatique par l'IA (Gemini)

**Verdict :** ${reviewResult.verdict === 'APPROVE' ? '✅ Approuvé' : reviewResult.verdict === 'REQUEST_CHANGES' ? '❌ Changements demandés' : '💬 Commentaires'}

${reviewResult.summary}

_Cette revue a été générée automatiquement par l'agent IA._`,
      event: reviewResult.verdict,
      comments: validComments
    };

    const submitReviewOptions = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-PR-Reviewer-Action',
        'Content-Type': 'application/json'
      }
    };

    await makeRequest(submitReviewOptions, reviewPayload);
    console.log("Revue publiée avec succès !");

  } catch (error) {
    console.error("Une erreur est survenue lors de l'exécution de la revue IA :", error);
    process.exit(1);
  }
}

run();
