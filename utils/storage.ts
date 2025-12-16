/**
 * Shared localStorage utilities for the SCBA Bénévoles application
 */

// Track which registrations belong to this browser
export const getMyRegistrations = (): Record<string, string[]> => {
    try {
        const data = localStorage.getItem('scba-my-registrations');
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

export const saveMyRegistration = (key: string, name: string): void => {
    const registrations = getMyRegistrations();
    if (!registrations[key]) {
        registrations[key] = [];
    }
    if (!registrations[key].includes(name)) {
        registrations[key].push(name);
    }
    localStorage.setItem('scba-my-registrations', JSON.stringify(registrations));
};

export const removeMyRegistration = (key: string, name: string): void => {
    const registrations = getMyRegistrations();
    if (registrations[key]) {
        registrations[key] = registrations[key].filter(n => n !== name);
        if (registrations[key].length === 0) {
            delete registrations[key];
        }
    }
    localStorage.setItem('scba-my-registrations', JSON.stringify(registrations));
};

export const isMyRegistration = (key: string, name: string): boolean => {
    const registrations = getMyRegistrations();
    return registrations[key]?.includes(name) || false;
};

// User name storage (for carpooling)
export const getStoredName = (): string => {
    try {
        return localStorage.getItem('scba-user-name') || '';
    } catch {
        return '';
    }
};

export const setStoredName = (name: string): void => {
    localStorage.setItem('scba-user-name', name.trim());
};
