import React, { useMemo } from 'react';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface EventSchemaProps {
  games: Game[];
}

/**
 * Component to inject JSON-LD structured data for Google Event Search
 * Helps matches show up in local event results
 */
const EventSchema: React.FC<EventSchemaProps> = ({ games }) => {
  const schemaData = useMemo(() => {
    // Take only the next 10 upcoming matches to keep the header light
    // ⚡ Bolt: Use YYYY-MM-DD string comparison to match game.dateISO format.
    const todayISO = getTodayISO();

    // ⚡ Bolt: Use early exit sequential loop on pre-sorted array to extract subset in O(K) instead of O(N log N)
    const upcomingGames: Game[] = [];
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      if (g.dateISO && g.dateISO >= todayISO) {
        upcomingGames.push(g);
        if (upcomingGames.length === 10) break;
      }
    }

    const eventSchemas = upcomingGames.map((game) => ({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `Match de Basket: SCBA vs ${game.opponent}`,
      description: `Match de basket de l'équipe ${game.team} (${game.isHome ? 'Domicile' : 'Extérieur'}). Venez nombreux encourager le Stade Clermontois Basket Auvergne !`,
      startDate: game.dateISO,
      location: {
        '@type': 'Place',
        name: game.location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Clermont-Ferrand',
          addressRegion: 'Auvergne',
          addressCountry: 'FR',
        },
      },
      image: 'https://scba.desimone.fr/logo-scba.webp',
      organizer: {
        '@type': 'Organization',
        name: 'Stade Clermontois Basket Auvergne',
        url: 'https://scba.desimone.fr',
      },
    }));

    return JSON.stringify(eventSchemas);
  }, [games]);

  return <script type="application/ld+json">{schemaData}</script>;
};

export default EventSchema;
