
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
  // Matching system
  status?: 'available' | 'pending' | 'matched'; // Current matching status
  matchedWith?: string[];   // IDs of matched passengers (for drivers) or driver ID (for passengers)
  requestedDriverId?: string; // For passengers: ID of driver they requested
}

export interface Game {
  id: string;
  team: string;
  opponent: string;
  date: string;                 // Display format: "Samedi 15 Novembre 2025"
  dateISO: string;              // ISO format: "2025-11-15" for reliable sorting
  time: string;
  location: string;
  isHome: boolean;              // true = domicile (bénévolat), false = extérieur (covoiturage)
  roles: Role[];
  carpool?: CarpoolEntry[]; // Optional carpooling entries
}

// Type for role configuration (used in constants)
export interface RoleConfig {
  name: string;
  capacity: number;
  icon: string;
}

export interface UserRegistration {
  id: string; // gameId_roleId
  gameId: string;
  roleId: string;
  roleName: string;
  gameDate: string; // ISO or formatted
  gameTime: string; // approx
  team: string; // opponent usually or "My Team" context
  opponent: string;
  location: string;
  volunteerName?: string; // The specific name used for this registration
  gameDateISO?: string;
  isValid?: boolean; // New flag to track if registration exists in public game
}

export interface GameFormData {
  id?: string;
  team: string; // Ex: 'Senior M1'
  opponent: string;
  date: string; // Format YYYY-MM-DD
  time: string; // Format HH:mm
  location: string;
  isHome: boolean;
  roleConfig?: RoleConfig[]; // Optional configuration for roles
}

export interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'urgent'; // Détermine la couleur/style
  message: string; // Le contenu, support Markdown basique si besoin
  active: boolean; // Soft delete / switch on-off rapide
  expiresAt: any; // Timestamp Firestore
  createdAt: any; // Timestamp Firestore
  createdBy: string; // User ID de l'admin
  target?: 'all' | 'volunteers' | 'admins'; // (Optionnel pour le futur, default 'all')
}
