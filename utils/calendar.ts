import type { Game } from '../types';
import { parseFrenchDate } from './dateUtils';

/**
 * Converts a game's date and time to start/end Date objects
 * Uses shared parseFrenchDate utility
 */
const parseGameDateTime = (game: Game): { start: Date; end: Date } | null => {
    // Use dateISO if available, otherwise parse display date
    const dateSource = game.dateISO || game.date;
    const parsed = parseFrenchDate(dateSource, game.time);

    if (!parsed) {
        console.error('Could not parse date/time for game:', game);
        return null;
    }

    const start = parsed;
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
    const dateTime = parseGameDateTime(game);
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

/**
 * Generates a Google Calendar URL for adding an event
 * Opens the event creation form pre-filled with game details
 */
export const getGoogleCalendarUrl = (game: Game): string | null => {
    const dateTime = parseGameDateTime(game);
    if (!dateTime) return null;

    const formatGoogleDate = (date: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    };

    const title = `🏀 ${game.team} vs ${game.opponent}`;
    const details = `Match de basket - ${game.team} contre ${game.opponent}\nBénévolat SCBA`;
    const dates = `${formatGoogleDate(dateTime.start)}/${formatGoogleDate(dateTime.end)}`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: dates,
        details: details,
        location: game.location,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generates an Outlook.com Calendar URL for adding an event
 * Opens the event creation form pre-filled with game details
 */
export const getOutlookCalendarUrl = (game: Game): string | null => {
    const dateTime = parseGameDateTime(game);
    if (!dateTime) return null;

    const formatOutlookDate = (date: Date): string => {
        return date.toISOString();
    };

    const title = `🏀 ${game.team} vs ${game.opponent}`;
    const body = `Match de basket - ${game.team} contre ${game.opponent}\nBénévolat SCBA`;

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: title,
        startdt: formatOutlookDate(dateTime.start),
        enddt: formatOutlookDate(dateTime.end),
        body: body,
        location: game.location,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};
