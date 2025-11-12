
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
