import React, { useMemo } from 'react';
import type { Game } from '../types';

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
        const upcomingGames = [...games]
            .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
            .filter(g => new Date(g.dateISO).getTime() > Date.now())
            .slice(0, 10);

        const eventSchemas = upcomingGames.map(game => ({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": `Match de Basket: SCBA vs ${game.opponent}`,
            "description": `Match de basket de l'équipe ${game.team} (${game.isHome ? 'Domicile' : 'Extérieur'}). Venez nombreux encourager le Stade Clermontois Basket Auvergne !`,
            "startDate": game.dateISO,
            "location": {
                "@type": "Place",
                "name": game.location,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Clermont-Ferrand",
                    "addressRegion": "Auvergne",
                    "addressCountry": "FR"
                }
            },
            "image": "https://scba.desimone.fr/logo-scba.png",
            "organizer": {
                "@type": "Organization",
                "name": "Stade Clermontois Basket Auvergne",
                "url": "https://scba.desimone.fr"
            }
        }));

        return JSON.stringify(eventSchemas);
    }, [games]);

    return (
        <script type="application/ld+json">
            {schemaData}
        </script>
    );
};

export default EventSchema;
