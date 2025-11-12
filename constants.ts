import { Game } from './types';

export const INITIAL_GAMES: Game[] = [
  {
    id: 'game-1',
    team: 'U11 - Équipe 1',
    opponent: 'Royat',
    date: 'Samedi 15 Novembre',
    time: '11H00',
    location: 'Maison des Sports',
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
    date: 'Samedi 15 Novembre',
    time: '13H30',
    location: 'Maison des Sports',
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
    date: 'Dimanche 16 Novembre',
    time: '10H00',
    location: 'Gymnase Thévenet',
    roles: [
      { id: 'g3-r1', name: 'Buvette', volunteers: [], capacity: 2 },
      { id: 'g3-r2', name: 'Chrono', volunteers: [], capacity: 1 },
      { id: 'g3-r3', name: 'Table de marque', volunteers: ['Maman d\'Emma'], capacity: 1 },
      { id: 'g3-r4', name: 'Goûter', volunteers: [], capacity: Infinity },
    ],
  },
];