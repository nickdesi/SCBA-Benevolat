import { useState, useEffect, useCallback } from 'react';
import type { Game } from '../types';

/**
 * Hook personnalisé pour la persistance des données dans localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Récupérer la valeur initiale depuis localStorage ou utiliser la valeur par défaut
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      let parsed = JSON.parse(item);

      // Migration: fix capacity values for games data
      if (key === 'scba-games' && Array.isArray(parsed)) {
        parsed = migrateGamesData(parsed);
      }

      return parsed;
    } catch (error) {
      console.warn(`Erreur lecture localStorage clé "${key}":`, error);
      return initialValue;
    }
  });

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Erreur écriture localStorage clé "${key}":`, error);
    }
  }, [key, storedValue]);

  // Wrapper pour permettre les fonctions de mise à jour
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue];
}

/**
 * Migration des données de jeux pour corriger les problèmes de capacité
 * - Les anciennes données peuvent avoir des capacités incorrectes
 * - Cette fonction normalise les valeurs
 */
function migrateGamesData(games: Game[]): Game[] {
  const STORAGE_VERSION_KEY = 'scba-data-version';
  const CURRENT_VERSION = 2;

  // Check if migration needed
  const storedVersion = parseInt(localStorage.getItem(STORAGE_VERSION_KEY) || '0');
  if (storedVersion >= CURRENT_VERSION) {
    return games;
  }

  console.log('🔄 Migration des données SCBA v' + CURRENT_VERSION);

  const migratedGames = games.map(game => ({
    ...game,
    roles: game.roles.map(role => {
      // Normalize capacity: ensure it's a proper number
      // capacity = 0 means unlimited (intentional)
      // capacity < 0 is invalid, set to 0 (unlimited)
      let newCapacity = role.capacity;

      // If capacity is somehow null/undefined, set based on role name
      if (newCapacity === null || newCapacity === undefined) {
        newCapacity = getDefaultCapacity(role.name);
      }

      // Ensure volunteers is always an array
      const volunteers = Array.isArray(role.volunteers) ? role.volunteers : [];

      return {
        ...role,
        capacity: newCapacity,
        volunteers,
      };
    }),
  }));

  // Save the new version
  localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));

  return migratedGames;
}

/**
 * Get default capacity for a role by name
 */
function getDefaultCapacity(roleName: string): number {
  const defaults: Record<string, number> = {
    'Buvette': 2,
    'Chrono': 1,
    'Table de marque': 1,
    'Goûter': 0, // 0 = unlimited
  };
  return defaults[roleName] ?? 1;
}
