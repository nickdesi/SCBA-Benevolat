
export interface Role {
  id: string;
  name: string;
  volunteers: string[];
  capacity: number;
}

// Carpooling entry
export interface CarpoolEntry {
  id: string;
  name: string;
  phone?: string;           // Optional phone number for contact
  type: 'driver' | 'passenger';
  seats?: number;           // For drivers: available seats
  departureLocation?: string; // Optional: departure point
}

export interface Game {
  id: string;
  team: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  isHome: boolean;              // true = domicile (bénévolat), false = extérieur (covoiturage)
  roles: Role[];
  carpool?: CarpoolEntry[]; // Optional carpooling entries
}

// Type for form data when creating/editing games
export interface GameFormData {
  team: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  isHome: boolean;
}

// Type for role configuration (used in constants)
export interface RoleConfig {
  name: string;
  capacity: number;
  icon: string;
}
