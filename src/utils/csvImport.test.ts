import { describe, it, expect } from 'vitest';
import { enrichMatchAddress } from './csvImport';

describe('enrichMatchAddress', () => {
  it('complète le code postal et la ville pour Pont-du-Château', () => {
    const loc = enrichMatchAddress('COSEC, Allee ste Marcelle', 'CS PONT DU CHATEAU - 1', false);
    expect(loc).toBe('COSEC, Allee ste Marcelle, 63430 Pont-du-Château');
  });

  it('complète le code postal et la ville pour Cusset (Salle Alain Mimoun)', () => {
    const loc = enrichMatchAddress(
      "SALLE ALAIN MIMOUN, 42 Avenue de l'Europe",
      'SCA CUSSET - 1',
      false,
    );
    expect(loc).toBe("SALLE ALAIN MIMOUN, 42 Avenue de l'Europe, 03300 Cusset");
  });

  it('gère les matchs à domicile sans adresse complète', () => {
    const loc = enrichMatchAddress('Domicile', 'CS PONT DU CHATEAU - 1', true);
    expect(loc).toBe('Maison des Sports, Place des Bughes, 63000 Clermont-Ferrand');
  });

  it('conserve une adresse qui a déjà un code postal valide', () => {
    const full = 'Gymnase J. Longo, Rue de Chapotte, 07300 Tournon-sur-Rhône';
    const loc = enrichMatchAddress(full, 'TAIN TOURNON', false);
    expect(loc).toBe(full);
  });

  it('complète avec Limonest pour Ouest Lyonnais sans inventer de ville spéculative', () => {
    const loc = enrichMatchAddress(
      'SALLE OMNISPORTS, 335 Route de Saint Didier',
      'OUEST LYONNAIS BASKET - 2',
      false,
    );
    expect(loc).toBe('SALLE OMNISPORTS, 335 Route de Saint Didier, 69760 Limonest');
  });

  it('ne déduit rien spéculativement si absent du registre', () => {
    const loc = enrichMatchAddress('SALLE INCONNUE, 10 Rue du Basket', 'CLUB INCONNU - 1', false);
    expect(loc).toBe('SALLE INCONNUE, 10 Rue du Basket');
  });
});
