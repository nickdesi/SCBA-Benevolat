/**
 * Utility to handle PWA Notifications
 */

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        // console.log('This browser does not support notifications.');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                ...options
            });
        });
    }
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

// User preference for notifications (stored in localStorage)
const NOTIF_PREF_KEY = 'scba_notifications_enabled';

export const getNotificationPreference = (): boolean => {
    return localStorage.getItem(NOTIF_PREF_KEY) === 'true';
};

export const setNotificationPreference = (enabled: boolean): void => {
    localStorage.setItem(NOTIF_PREF_KEY, String(enabled));
};
