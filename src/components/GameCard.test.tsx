import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import GameCard from './GameCard';

const game: Game = {
  id: 'test-game',
  team: 'U13',
  opponent: 'Club visiteur',
  date: 'Samedi 14 novembre 2026',
  dateISO: '2026-11-14',
  time: '11:00',
  location: 'Gymnase',
  isHome: true,
  roles: [{ id: 'table', name: 'Table', capacity: 1, volunteers: ['Bénévole'] }],
};

const renderCard = (match: Game) =>
  renderToStaticMarkup(
    <GameCard
      game={match}
      isAdmin={false}
      isEditing={false}
      onVolunteer={() => {}}
      onRemoveVolunteer={() => {}}
      onUpdateVolunteer={() => {}}
      onAddCarpool={() => {}}
      onRemoveCarpool={() => {}}
      onEditRequest={() => {}}
      onCancelEdit={() => {}}
      onDeleteRequest={() => {}}
      onUpdateRequest={() => {}}
    />,
  );

describe('GameCard celebration', () => {
  it('only celebrates home games with all volunteer roles filled', () => {
    expect(renderCard(game)).toContain('class="garland"');
    expect(renderCard({ ...game, roles: [] })).not.toContain('class="garland"');
    expect(
      renderCard({
        ...game,
        roles: [{ ...game.roles[0], volunteers: [] }],
      }),
    ).not.toContain('class="garland"');
  });

  it('does not celebrate away games, whether their roles are empty or filled', () => {
    expect(renderCard({ ...game, isHome: false, roles: [] })).not.toContain('class="garland"');
    expect(renderCard({ ...game, isHome: false })).not.toContain('class="garland"');
  });
});
