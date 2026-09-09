import type { ParsedMatch } from './csvImport';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  road?: string;
  pedestrian?: string;
  house_number?: string;
  postcode?: string;
}

interface NominatimResult {
  name?: string;
  address?: NominatimAddress;
}

interface DataESRecord {
  aps_name?: string[];
  com_nom?: string;
  lib_bdv?: string;
  equip_type_name?: string;
  equip_nom?: string;
  inst_nom?: string;
  inst_adresse?: string;
  inst_cp?: string;
}

/**
 * Interroge OpenStreetMap Nominatim pour trouver les gymnases et équipements sportifs d'une ville.
 */
const fetchNominatimLocations = async (
  cityName: string,
  cityNameLower: string,
): Promise<string[]> => {
  const results: string[] = [];
  const queries = [
    `gymnase ${cityName}`,
    `salle polyvalente ${cityName}`,
    `complexe sportif ${cityName}`,
    `stade ${cityName}`,
    `${cityName}`,
  ];

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3&countrycodes=fr`,
        { headers: { 'Accept-Language': 'fr' } },
      );
      const data: NominatimResult[] = await response.json();

      for (const result of data) {
        const addr = result.address || {};
        const resultCity = (
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          ''
        ).toLowerCase();
        const resultCityNorm = resultCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (resultCityNorm.includes(cityNameLower) || cityNameLower.includes(resultCityNorm)) {
          const name = result.name || 'Gymnase / Salle';
          const street = addr.road || addr.pedestrian || '';
          const houseNumber = addr.house_number || '';
          const postcode = addr.postcode || '';
          const city = addr.city || addr.town || addr.village || cityName;

          const fullAddress = [
            name,
            [houseNumber, street].filter(Boolean).join(' '),
            [postcode, city].filter(Boolean).join(' '),
          ]
            .filter(Boolean)
            .join(', ');

          results.push(fullAddress);
        }
      }
    } catch {
      /* ignore */
    }
    if (results.length > 0 && queries.indexOf(query) < 2) break;
  }
  return results;
};

/**
 * Interroge la base nationale Data ES (Ministère des Sports) pour les salles de basket et gymnases.
 */
const fetchDataESLocations = async (cityName: string, cityNameLower: string): Promise<string[]> => {
  const results: string[] = [];
  try {
    const response = await fetch(
      `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?` +
        `where=search(inst_nom, "${encodeURIComponent(cityName)}")` +
        `%20OR%20search(equip_nom, "${encodeURIComponent(cityName)}")` +
        `%20OR%20search(com_nom, "${encodeURIComponent(cityName)}")` +
        `&limit=8`,
    );
    const data = await response.json();

    if (Array.isArray(data?.results)) {
      for (const record of data.results as DataESRecord[]) {
        const sports = record.aps_name || [];
        const isBasket = sports.some((s) => s && s.toLowerCase().includes('basket'));

        const recCity = (record.com_nom || record.lib_bdv || '').toLowerCase();
        const recCityNorm = recCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (
          recCityNorm.includes(cityNameLower) &&
          (isBasket ||
            record.equip_type_name?.includes('Gymnase') ||
            record.equip_type_name?.includes('Salle multisports'))
        ) {
          const name = record.equip_nom || record.inst_nom || 'Gymnase';
          const address = record.inst_adresse || '';
          const zip = record.inst_cp || '';
          const city = record.lib_bdv || record.com_nom || cityName;

          const fullAddress = [name, address, `${zip} ${city}`].filter(Boolean).join(', ');
          results.push(fullAddress);
        }
      }
    }
  } catch (e) {
    console.error('Data ES error', e);
  }
  return results;
};

/**
 * Enrichit les adresses des matchs extérieurs génériques en interrogeant OpenData ES et Nominatim.
 */
export const enrichMatchesLocations = async (
  matches: ParsedMatch[],
  onProgress?: (updated: ParsedMatch[]) => void,
): Promise<ParsedMatch[]> => {
  const updatedMatches = [...matches];
  const matchesToEnrich = updatedMatches
    .map((match, index) => ({ match, index }))
    .filter(
      ({ match }) =>
        !match.isHome &&
        (match.location === 'Extérieur' || match.location.startsWith('Extérieur (')),
    );

  const cityGroups = new Map<string, { match: ParsedMatch; index: number }[]>();
  matchesToEnrich.forEach(({ match, index }) => {
    const cityMatch = match.location.match(/Extérieur \((.+)\)/i);
    if (cityMatch) {
      const cityName = cityMatch[1]?.trim();
      if (cityName) {
        if (!cityGroups.has(cityName)) {
          cityGroups.set(cityName, []);
        }
        cityGroups.get(cityName)!.push({ match, index });
      }
    }
  });

  const uniqueCities = Array.from(cityGroups.keys());
  const CHUNK_SIZE = 3;

  for (let i = 0; i < uniqueCities.length; i += CHUNK_SIZE) {
    const chunkCities = uniqueCities.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunkCities.map(async (cityName) => {
        const cityNameLower = cityName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const [nominatimResults, dataEsResults] = await Promise.all([
          fetchNominatimLocations(cityName, cityNameLower),
          fetchDataESLocations(cityName, cityNameLower),
        ]);

        const candidates = Array.from(new Set([...dataEsResults, ...nominatimResults]));
        const matchesForCity = cityGroups.get(cityName)!;

        if (candidates.length > 0) {
          matchesForCity.forEach(({ match, index }) => {
            updatedMatches[index] = {
              ...match,
              location: candidates[0],
              candidates,
            };
          });
        } else {
          matchesForCity.forEach(({ match, index }) => {
            updatedMatches[index] = {
              ...match,
              location: `À ${cityName} (adresse introuvable)`,
            };
          });
        }
      }),
    );

    onProgress?.([...updatedMatches]);
    if (i + CHUNK_SIZE < uniqueCities.length) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return updatedMatches;
};
