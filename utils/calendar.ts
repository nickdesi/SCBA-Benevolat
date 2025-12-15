import type { Game } from '../types';

/**
 * Converts a French date string (e.g., "Samedi 14 décembre 2024") and time to ICS format
 */
const parseGameDateTime = (dateStr: string, timeStr: string): { start: Date; end: Date } | null => {
    // French month names mapping
    const monthMap: Record<string, number> = {
        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };

    // Try to parse date like "Samedi 14 décembre 2024" or "14/12/2024" or "2024-12-14"
    let day: number, month: number, year: number;

    // Format: "Jour XX mois YYYY"
    const frenchMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (frenchMatch) {
        day = parseInt(frenchMatch[1], 10);
        month = monthMap[frenchMatch[2].toLowerCase()] ?? 0;
        year = parseInt(frenchMatch[3], 10);
    }
    // Format: "DD/MM/YYYY"
    else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    }
    // Format: "YYYY-MM-DD"
    else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
    }
    else {
        return null;
    }

    // Parse time like "14:30" or "14h30"
    const timeMatch = timeStr.match(/(\d{1,2})[h:](\d{2})/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    const start = new Date(year, month, day, hours, minutes);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return { start, end };
};

/**
 * Formats a Date to ICS datetime format (YYYYMMDDTHHMMSS)
 */
const formatICSDate = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
};

/**
 * Generates an ICS calendar file content for a game
 */
export const generateICSContent = (game: Game): string | null => {
    const dateTime = parseGameDateTime(game.date, game.time);
    if (!dateTime) return null;

    const title = `🏀 ${game.team} vs ${game.opponent}`;
    const description = `Match de basket - ${game.team} contre ${game.opponent}\\nBénévolat SCBA`;
    const location = game.location;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SCBA Bénévoles//Match Calendar//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${game.id}@scba-benevoles`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(dateTime.start)}`,
        `DTEND:${formatICSDate(dateTime.end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Rappel match dans 1 heure',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
};

/**
 * Downloads an ICS file for a game
 */
export const downloadGameCalendar = (game: Game): boolean => {
    const icsContent = generateICSContent(game);
    if (!icsContent) {
        console.error('Could not generate calendar file for game:', game);
        return false;
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `match-${game.team.replace(/\s+/g, '-')}-vs-${game.opponent.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    return true;
};
