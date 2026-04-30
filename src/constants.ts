import { RoleConfig } from './types';

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