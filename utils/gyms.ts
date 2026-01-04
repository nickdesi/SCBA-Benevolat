/**
 * Registre des adresses de gymnases pour les équipes adverses.
 * Clés: Nom de l'équipe (ou de la ville) tel que normalisé ou trouvé dans l'import.
 * Valeurs: Adresse complète.
 */
export const GYM_REGISTRY: Record<string, string> = {
    // Équipes de la poule (basé sur l'import csvImport.ts et recherches)
    "RIORGES": "Parc Sportif Galliéni, 439 avenue Galliéni, 42153 Riorges",
    "VALLAURIS": "Gymnase Jacques Allinéi, 176 avenue des Mimosas, 06220 Golfe-Juan",
    "TAIN TOURNON": "Gymnase J. Longo, Rue de Chapotte, 07300 Tournon-sur-Rhône",
    "ROCHE VENDÉE": "Halle des Sports des Oudairies, Rue Giotto, 85000 La Roche-sur-Yon",
    "LYON SO": "La Canopée, 30 Rue Charles de Gaulle, 69310 Oullins-Pierre-Bénite",

    // Autres variations possibles
    "RIORGES BC": "Parc Sportif Galliéni, 439 avenue Galliéni, 42153 Riorges",
    "GOLFE JUAN": "Gymnase Jacques Allinéi, 176 avenue des Mimosas, 06220 Golfe-Juan",
    "TAIN": "Gymnase J. Longo, Rue de Chapotte, 07300 Tournon-sur-Rhône",
    "TOURNON": "Gymnase J. Longo, Rue de Chapotte, 07300 Tournon-sur-Rhône",
    "RVBC": "Halle des Sports des Oudairies, Rue Giotto, 85000 La Roche-sur-Yon",

    // Nouveaux ajouts (Feedback utilisateur)
    "NEYRAT": "Gymnase Jules Verne, Rue des Aulnes, 63100 Clermont-Ferrand",
    "ANDREZIEUX": "Palais des Sports, 23 rue des Bullieux, 42160 Andrézieux-Bouthéon", // ou Gymnase Lacoste selon équipe

    // CTC Bédat Volcans (Attention: Plusieurs salles possibles, le nom complet est important)
    "CTC BÉDAT VOLCANS BASKET - NOHANENT PUY VALEIX": "Espace Sportif du Puy Valeix, Rue du Puy-Valeix, 63830 Nohanent",
    "NOHANENT PUY VALEIX": "Espace Sportif du Puy Valeix, Rue du Puy-Valeix, 63830 Nohanent",
    // Clés génériques "au cas où" (à utiliser avec prudence, priorité aux clés longues gérée par le code d'import)
    "NOHANENT": "Espace Sportif du Puy Valeix, Rue du Puy-Valeix, 63830 Nohanent",
    "BÉDAT": "Complexe Sportif Sayat, Rue Gustave Fougère, 63530 Sayat", // Défaut souvent Sayat si pas précisé Nohanent

    // Sorgues
    "SORGUES": "Plaine Sportive, Chemin de Lucette, 84700 Sorgues",

    // Nouveaux ajouts (NM3/PNM Poule A)
    "FRONTIGNAN": "Salle Roger Arnaud, 4 avenue Jean Mermoz, 34110 Frontignan",
    "AGDE": "Palais des Sports, Boulevard des Héllènes, 34300 Agde",
    "MONTBRISON": "Gymnase J.P. Cherblanc, Rue de Beauregard, 42600 Montbrison",
    "TOULOUGES": "Halle des Sports, 11 Boulevard de Clairfont, 66350 Toulouges",
    "CASTELNAU": "Palais des Sports J. Chaban-Delmas, 515 avenue de la Monnaie, 34170 Castelnau-le-Lez",
    "MONTELIMAR": "Halle des Sports des Alexis, 58 Chemin des Alexis, 26200 Montélimar",
    "RODEZ": "Gymnase Ginette Mazel, Chemin de l'Auterne, 12000 Rodez",
    "AUBENAS": "Halle des Sports, 14 Boulevard Maréchal Leclerc, 07200 Aubenas",

    // CTC Ouest Montpellier Métropole (Saint Jean de Védas est le site principal souvent utilisé pour la N3)
    "CTC OUEST MONTPELLIER METROPOLE BASKET": "Gymnase Miralles, Rue Federico Garcia Lorca, 34430 Saint-Jean-de-Védas",
    "IE - CTC OUEST MONTPELLIER METROPOLE BASKET - 1": "Gymnase Miralles, Rue Federico Garcia Lorca, 34430 Saint-Jean-de-Védas",
    "OUEST MONTPELLIER": "Gymnase Miralles, Rue Federico Garcia Lorca, 34430 Saint-Jean-de-Védas",

    // Nouveaux ajouts (NM3/PNM Poule B - Senior M1 - Clés explicites)
    "IE - CASTELNAU BASKET": "Palais des Sports J. Chaban-Delmas, 515 avenue de la Monnaie, 34170 Castelnau-le-Lez",
    "SORGUES BASKET CLUB - 1": "Plaine Sportive, Chemin de Lucette, 84700 Sorgues",
    "IE - MONTELIMAR UMS": "Halle des Sports des Alexis, 58 Chemin des Alexis, 26200 Montélimar",
    "FRONTIGNAN LA PEYRADE BASKET - 1": "Salle Roger Arnaud, 4 avenue Jean Mermoz, 34110 Frontignan",
    "RODEZ BASKET AVEYRON - 1": "Gymnase Ginette Mazel, Chemin de l'Auterne, 12000 Rodez",
    "AGDE BASKET - 1": "Palais des Sports, Boulevard des Héllènes, 34300 Agde",
    "AUBENAS US - 1": "Halle des Sports, 14 Boulevard Maréchal Leclerc, 07200 Aubenas",
    "MONTBRISON MASCULINS BC - 1": "Gymnase J.P. Cherblanc, Rue de Beauregard, 42600 Montbrison",
    "TAIN TOURNON AG - 1": "Gymnase J. Longo, Rue de Chapotte, 07300 Tournon-sur-Rhône",
    "TOULOUGES BA": "Halle des Sports, 11 Boulevard de Clairfont, 66350 Toulouges",

    // Nouveaux ajouts (RM2 Poule A)
    "COTE ROANNAISE": "Gymnase de Renaison, 152 Rue du Gruyère, 42370 Renaison",
    "CUSSET": "Complexe Sportif des Darcins, Rue des Darcins, 03300 Cusset", // ou Salle Louis Chambonnière selon match
    "SCA CUSSET": "Complexe Sportif des Darcins, Rue des Darcins, 03300 Cusset",
    "ENFANTS DU FOREZ": "Forezium André Delorme, Rue de la Paparelle, 42110 Feurs",
    "FEURS": "Forezium André Delorme, Rue de la Paparelle, 42110 Feurs",
    "NEULISE": "Le Neulizium, Route de la Digue, 42590 Neulise",
    "NEULISE AL - 1": "Le Neulizium, Route de la Digue, 42590 Neulise",
    "ANDREZIEUX-BOUTHEON LOIRE SUD BASKET - 2": "Palais des Sports, 23 rue des Bullieux, 42160 Andrézieux-Bouthéon",
    "LES ENFANTS DU FOREZ FEURS ROZIER - 2": "Forezium André Delorme, Rue de la Paparelle, 42110 Feurs",

    // Nouveaux ajouts (U18M1 - Région A)
    "PONTOISE": "Gymnase Bonbonnière, Rue des Écoles, 42170 Saint-Just-Saint-Rambert",
    "PONTOISE ULR BASKET ST JUST ST RAMBERT": "Gymnase Bonbonnière, Rue des Écoles, 42170 Saint-Just-Saint-Rambert",
    "VILLEFRANCHE": "Gymnase Bointon, 212 rue Bointon, 69400 Villefranche-sur-Saône",
    "BC VILLEFRANCHE BEAUJOLAIS": "Gymnase Bointon, 212 rue Bointon, 69400 Villefranche-sur-Saône",
    "COURNON": "Salle Joseph et Michel Gardet, 9 rue des Fusillés de Vingré, 63800 Cournon-d'Auvergne",
    "VAULX EN VELIN": "Gymnase Aubert, Allée du Stade, 69120 Vaulx-en-Velin",
    "VICHY": "Palais des Sports Pierre Coulon, Route du Pont de l'Europe, 03700 Bellerive-sur-Allier",
    "JEANNE D'ARC DE VICHY": "Palais des Sports Pierre Coulon, Route du Pont de l'Europe, 03700 Bellerive-sur-Allier",

    // Nouveaux ajouts (U18M2 - Région B)
    "ETOILE DE CHAMALIERES SAYAT": "Complexe Sportif Alain Bresson, 2 Bis Allée du Gymnase, 63400 Chamalières",
    "CHAMALIERES": "Complexe Sportif Alain Bresson, 2 Bis Allée du Gymnase, 63400 Chamalières",
    "BASKET-BALL BRIVADOIS": "Halle des Sports, Avenue Pierre Mendès France, 43100 Brioude",
    "BRIVADOIS": "Halle des Sports, Avenue Pierre Mendès France, 43100 Brioude",
    "US VIC LE COMTE BASKET": "Complexe Sportif Omnisport André Boste, Route d'Ambert, 63270 Vic-le-Comte",
    "VIC LE COMTE": "Complexe Sportif Omnisport André Boste, Route d'Ambert, 63270 Vic-le-Comte",
    "IE - CTC CLERMONT SUD GERGOVIE BASKET - BASKET CLUB LA ROCHE BLANCHE - 2": "Salle des Sports, Rue du Stade, 63670 La Roche-Blanche",
    "LA ROCHE BLANCHE": "Salle des Sports, Rue du Stade, 63670 La Roche-Blanche",
    "GERGOVIE": "Salle des Sports, Rue du Stade, 63670 La Roche-Blanche", // Vérifier si Gergovie utilise une autre salle parfois

    // Nouveaux ajouts (U15M1)
    "CS PONT DU CHATEAU": "COSEC, Allée de Sainte Marcelle, 63430 Pont-du-Château",
    "PONT DU CHATEAU": "COSEC, Allée de Sainte Marcelle, 63430 Pont-du-Château",
    "BASKET CLUB VALLEE DU JARNOSSIN": "Salle Paul Lafay, 248 Place de l'Église, 42460 Coutouvre",
    "JARNOSSIN": "Salle Paul Lafay, 248 Place de l'Église, 42460 Coutouvre",
    "US CHAURIAT VERTAIZON": "Salle des Sports, Rue Chantemerle, 63117 Chauriat",
    "CHAURIAT": "Salle des Sports, Rue Chantemerle, 63117 Chauriat",

    // Nouveaux ajouts (U15M2)
    "US ISSOIRE": "Gymnase Fernand Counil, 15 Chemin des Croizettes, 63500 Issoire",
    "ISSOIRE": "Gymnase Fernand Counil, 15 Chemin des Croizettes, 63500 Issoire",
    "SBC DESERTINES": "Gymnase de Désertines, 03630 Désertines",
    "DESERTINES": "Gymnase de Désertines, 03630 Désertines",
    "ALFA SAINT JACQUES": "Gymnase, 14 Rue Berteaux, 63000 Clermont-Ferrand",
    "SAINT JACQUES": "Gymnase, 14 Rue Berteaux, 63000 Clermont-Ferrand",
    "US SAINT GEORGES LES ANCIZES": "Stade de Grelières, 63780 Saint-Georges-de-Mons",
    "SAINT GEORGES": "Stade de Grelières, 63780 Saint-Georges-de-Mons",

    // Nouveaux ajouts (U13M)
    "AMICALE LAIQUE BASKET LUSSAT": "Gymnase Municipal, Rue de la Molle Sud, 63360 Lussat",
    "LUSSAT": "Gymnase Municipal, Rue de la Molle Sud, 63360 Lussat",
    "CLUB SPORTIF DE PONT DE DORE": "Halle des Sports CSP, Chemin des Torrents, 63920 Pont de Dore",
    "PONT DE DORE": "Halle des Sports CSP, Chemin des Torrents, 63920 Pont de Dore",

    // Nouveaux ajouts (U11M1)
    "BC LEMPDES": "Parc des Sports Bernard Bordiau, Rue du Stade, 63370 Lempdes",
    "LEMPDES": "Parc des Sports Bernard Bordiau, Rue du Stade, 63370 Lempdes",
    "ROYAT ORCINES CLUB BASKET BALL": "Complexe Sportif du Breuil, Chemin du Breuil, 63130 Royat",
    "ROYAT ORCINES": "Complexe Sportif du Breuil, Chemin du Breuil, 63130 Royat",
    "CLERMONT BASKET": "Gymnase Granouillet, 45 Rue de Châteaudun, 63000 Clermont-Ferrand", // Vérifier si pas Gymnase Jules Ferry

    // Nouveaux ajouts (U11M2)
    "SC BILLOM": "Gymnase Municipal, Avenue Victor Cohalion, 63160 Billom",
    "BILLOM": "Gymnase Municipal, Avenue Victor Cohalion, 63160 Billom",
    "AIGUEPERSE BASKET CLUB": "Salle des Sports, Boulevard de l'Hôpital, 63260 Aigueperse",
    "AIGUEPERSE": "Salle des Sports, Boulevard de l'Hôpital, 63260 Aigueperse",
    "BC VAL DE VEYRE ORCET": "Salle Jean Moulin, Rue de l'Avenir, 63670 Orcet",
    "VAL DE VEYRE": "Salle Jean Moulin, Rue de l'Avenir, 63670 Orcet",
    "ORCET": "Salle Jean Moulin, Rue de l'Avenir, 63670 Orcet",

    // Nouveaux ajouts (U9M1)
    "AL AUBIERE": "Gymnase A.L. Aubière, Rue Vercingétorix, 63170 Aubière",
    "AUBIERE": "Gymnase A.L. Aubière, Rue Vercingétorix, 63170 Aubière",
    "NEYRAT BASKET ASSOCIATION": "Gymnase Jules Verne, Rue des Aulnes, 63100 Clermont-Ferrand", // Alias explicite
};
