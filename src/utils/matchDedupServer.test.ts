import { describe, expect, it } from 'vitest';
import {
  countMatchVolunteers,
  mergeDuplicateMatchData,
  type MatchData,
} from '../../functions/src/matchDedup';

describe('server-side match deduplication', () => {
  it('keeps volunteer and avatar registrations from every duplicate', () => {
    const older: MatchData = {
      time: '14:00',
      roles: [
        {
          id: 'table-role',
          name: 'Table',
          capacity: 1,
          volunteers: ['Alice'],
          avatars: { Alice: 'alice.jpg' },
        },
      ],
    };
    const newer: MatchData = {
      time: '15:00',
      roles: [
        {
          id: '1',
          name: 'Table',
          capacity: 2,
          volunteers: ['Bob', 'alice'],
          avatars: { Bob: 'bob.jpg' },
        },
      ],
    };

    const merged = mergeDuplicateMatchData([older, newer]);
    expect(merged.time).toBe('15:00');
    expect(merged.roles).toEqual([
      {
        id: '1',
        name: 'Table',
        capacity: 2,
        volunteers: ['Alice', 'Bob'],
        avatars: { Alice: 'alice.jpg', Bob: 'bob.jpg' },
      },
    ]);
    expect(countMatchVolunteers(merged)).toBe(2);
  });

  it('merges duplicate carpool entries and remaps their relationships', () => {
    const first: MatchData = {
      carpool: [
        { id: 'driver-old', type: 'driver', name: 'Nicolas', seats: 2, phone: '06 11 22 33 44' },
        {
          id: 'passenger',
          type: 'passenger',
          name: 'Alice',
          seats: 1,
          status: 'pending',
          requestedDriverId: 'driver-new',
        },
      ],
    };
    const second: MatchData = {
      carpool: [
        {
          id: 'driver-new',
          type: 'driver',
          name: 'Nicolas',
          seats: 3,
          phone: '0611223344',
          status: 'available',
          matchedWith: ['passenger'],
        },
      ],
    };

    const merged = mergeDuplicateMatchData([first, second]);
    expect(merged.carpool).toEqual([
      {
        id: 'driver-old',
        type: 'driver',
        name: 'Nicolas',
        seats: 3,
        phone: '0611223344',
        status: 'available',
        matchedWith: ['passenger'],
      },
      {
        id: 'passenger',
        type: 'passenger',
        name: 'Alice',
        seats: 1,
        status: 'pending',
        requestedDriverId: 'driver-old',
      },
    ]);
  });

  it('does not write undefined fields from legacy carpool entries', () => {
    const first: MatchData = {
      carpool: [{ id: 'driver-old', type: 'driver', name: 'Nicolas', seats: 2 }],
    };
    const second: MatchData = {
      carpool: [{ id: 'driver-new', type: 'driver', name: 'Nicolas', seats: 3 }],
    };

    const merged = mergeDuplicateMatchData([first, second]);
    const driver = (merged.carpool as MatchData[])[0];
    expect(driver).not.toHaveProperty('status');
    expect(driver).not.toHaveProperty('requestedDriverId');
    expect(driver).not.toHaveProperty('matchedWith');
  });
});
