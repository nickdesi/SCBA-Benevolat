
export interface Role {
  id: string;
  name: string;
  volunteers: string[];
  capacity: number;
}

export interface Game {
  id: string;
  team: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  roles: Role[];
}

// Type for form data when creating/editing games
export interface GameFormData {
  team: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
}

// Type for role configuration (used in constants)
export interface RoleConfig {
  name: string;
  capacity: number;
  icon: string;
}
