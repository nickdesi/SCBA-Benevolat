import { Game, RoleConfig } from './types';

// French month names to number mapping (shared across date parsing)
export const MONTH_MAP: Record<string, number> = {
  'janvier': 0, 'fevrier': 1, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'aout': 7, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10,
  'decembre': 11, 'décembre': 11
};

// Default roles configuration - centralized for reuse
export const DEFAULT_ROLES: RoleConfig[] = [
  { name: 'Buvette', capacity: 2, icon: '🍺' },
  { name: 'Chrono', capacity: 1, icon: '⏱️' },
  { name: 'Table de marque', capacity: 1, icon: '📋' },
  { name: 'Goûter', capacity: 0, icon: '🍪' }, // 0 = unlimited
];

// Teams list from official structure
export const SCBA_TEAMS = [
  "SENIOR M1",
  "SENIOR M2",
  "U18 M1",
  "U18 M2",
  "U15 M1",
  "U15 M2",
  "U13 M1",
  "U11 M1",
  "U11 M2",
  "U9 M1"
];

// Common venues for auto-completion
export const COMMON_LOCATIONS = [
  "Maison des Sports",
  "Gymnase Thévenet",
  "Gymnase Granouillet",
  "Gymnase Autun",
  "Gymnase Fleury"
];


export const INITIAL_GAMES: Game[] = [
  {
    id: 'game-1',
    team: 'U11 - Équipe 1',
    opponent: 'Royat',
    date: 'Samedi 15 Novembre 2025',
    dateISO: '2025-11-15',
    time: '11H00',
    location: 'Maison des Sports',
    isHome: true,
    roles: [
      { id: 'g1-r1', name: 'Buvette', volunteers: [], capacity: 2 },
      { id: 'g1-r2', name: 'Chrono', volunteers: [], capacity: 1 },
      { id: 'g1-r3', name: 'Table de marque', volunteers: [], capacity: 1 },
      { id: 'g1-r4', name: 'Goûter', volunteers: [], capacity: Infinity },
    ],
  },
  {
    id: 'game-2',
    team: 'U11 - Équipe 2',
    opponent: 'Pont du Château',
    date: 'Samedi 15 Novembre 2025',
    dateISO: '2025-11-15',
    time: '13H30',
    location: 'Maison des Sports',
    isHome: true,
    roles: [
      { id: 'g2-r1', name: 'Buvette', volunteers: ['Parent de Léo'], capacity: 2 },
      { id: 'g2-r2', name: 'Chrono', volunteers: [], capacity: 1 },
      { id: 'g2-r3', name: 'Table de marque', volunteers: [], capacity: 1 },
      { id: 'g2-r4', name: 'Goûter', volunteers: [], capacity: Infinity },
    ],
  },
  {
    id: 'game-3',
    team: 'U13 - Équipe 1',
    opponent: 'ASM Basket',
    date: 'Dimanche 16 Novembre 2025',
    dateISO: '2025-11-16',
    time: '10H00',
    location: 'Gymnase Thévenet',
    isHome: true,
    roles: [
      { id: 'g3-r1', name: 'Buvette', volunteers: [], capacity: 2 },
      { id: 'g3-r2', name: 'Chrono', volunteers: [], capacity: 1 },
      { id: 'g3-r3', name: 'Table de marque', volunteers: ['Maman d\'Emma'], capacity: 1 },
      { id: 'g3-r4', name: 'Goûter', volunteers: [], capacity: Infinity },
    ],
  },
];