export type MatchData = Record<string, unknown>;

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr');

const isRecord = (value: unknown): value is MatchData =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toRecords = (value: unknown): MatchData[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const toStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const uniqueStrings = (...values: unknown[]): string[] => {
  const unique = new Map<string, string>();
  for (const value of values) {
    for (const item of toStrings(value)) {
      const key = normalizeText(item);
      if (key && !unique.has(key)) unique.set(key, item);
    }
  }
  return [...unique.values()];
};

const mergeCapacity = (left: unknown, right: unknown): number | undefined => {
  const values = [left, right].filter((value): value is number => typeof value === 'number');
  if (values.length === 0) return undefined;
  if (values.some((value) => value === 0 || value === Number.POSITIVE_INFINITY)) return 0;
  return Math.max(...values);
};

const mergeAvatars = (...values: unknown[]): Record<string, string> => {
  const merged: Record<string, string> = {};
  for (const value of values) {
    if (!isRecord(value)) continue;
    for (const [name, url] of Object.entries(value)) {
      if (typeof url === 'string' && url) merged[name] = url;
    }
  }
  return merged;
};

const mergeRoles = (...roleSets: unknown[]): MatchData[] => {
  const merged: MatchData[] = [];
  const idIndexes = new Map<string, number>();
  const nameIndexes = new Map<string, number>();

  for (const role of roleSets.flatMap(toRecords)) {
    const id = normalizeText(role.id);
    const name = normalizeText(role.name);
    const existingIndex =
      (id ? idIndexes.get(id) : undefined) ?? (name ? nameIndexes.get(name) : undefined);

    if (existingIndex === undefined) {
      if (id) idIndexes.set(id, merged.length);
      if (name) nameIndexes.set(name, merged.length);
      merged.push({
        ...role,
        volunteers: uniqueStrings(role.volunteers),
        avatars: mergeAvatars(role.avatars),
      });
      continue;
    }

    const existing = merged[existingIndex];
    const combined: MatchData = {
      ...existing,
      ...role,
      volunteers: uniqueStrings(existing.volunteers, role.volunteers),
      avatars: mergeAvatars(existing.avatars, role.avatars),
    };
    const capacity = mergeCapacity(existing.capacity, role.capacity);
    if (capacity !== undefined) combined.capacity = capacity;
    merged[existingIndex] = combined;
    if (id) idIndexes.set(id, existingIndex);
    if (name) nameIndexes.set(name, existingIndex);
  }

  return merged.sort((left, right) => {
    const leftId = String(left.id ?? '');
    const rightId = String(right.id ?? '');
    const leftRank = /^\d+$/.test(leftId) ? Number(leftId) : Number.MAX_SAFE_INTEGER;
    const rightRank = /^\d+$/.test(rightId) ? Number(rightId) : Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
};

const carpoolIdentity = (entry: MatchData, fallbackIndex: number): string => {
  const type = normalizeText(entry.type);
  const ownerUid = normalizeText(entry.ownerUid);
  if (ownerUid) return `${type}:uid:${ownerUid}`;

  const phone = normalizeText(entry.phone).replace(/\D/g, '');
  if (phone) return `${type}:phone:${phone}`;

  const name = normalizeText(entry.name);
  return name ? `${type}:name:${name}` : `${type}:entry:${fallbackIndex}`;
};

const statusWeight = (status: unknown): number => {
  if (status === 'matched') return 2;
  if (status === 'pending') return 1;
  return 0;
};

export const getMatchDeduplicationKeys = (record: MatchData): string[] => {
  const keys: string[] = [];
  const ffbbMatchId = normalizeText(record.ffbbMatchId);
  if (ffbbMatchId) keys.push(`ffbb:${ffbbMatchId}`);

  const dateISO = normalizeText(record.dateISO);
  const team = normalizeText(record.team);
  const opponent = normalizeText(record.opponent);
  if (dateISO && team && opponent) {
    keys.push(`local:${dateISO}|${team}|${opponent}|${String(record.isHome ?? '')}`);
  }
  return keys;
};

export const groupDuplicateRecordIndices = (records: MatchData[]): number[][] => {
  const parents = records.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const union = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const keyOwners = new Map<string, number>();

  records.forEach((record, index) => {
    const keys = getMatchDeduplicationKeys(record);
    if (keys.length === 0) {
      keyOwners.set(`record:${index}`, index);
      return;
    }
    for (const key of keys) {
      const owner = keyOwners.get(key);
      if (owner === undefined) keyOwners.set(key, index);
      else union(index, owner);
    }
  });

  const groups = new Map<number, number[]>();
  records.forEach((_, index) => {
    const root = find(index);
    const group = groups.get(root);
    if (group) group.push(index);
    else groups.set(root, [index]);
  });
  return [...groups.values()];
};

const mergeCarpool = (...entrySets: unknown[]): MatchData[] => {
  const merged: MatchData[] = [];
  const indexes = new Map<string, number>();
  const aliases = new Map<string, string>();
  let sourceIndex = 0;

  for (const entry of entrySets.flatMap(toRecords)) {
    const identity = carpoolIdentity(entry, sourceIndex++);
    const existingIndex = indexes.get(identity);
    const incomingId = typeof entry.id === 'string' ? entry.id : '';

    if (existingIndex === undefined) {
      indexes.set(identity, merged.length);
      merged.push({
        ...entry,
        matchedWith: uniqueStrings(entry.matchedWith),
      });
      if (incomingId) aliases.set(incomingId, incomingId);
      continue;
    }

    const existing = merged[existingIndex];
    const existingId = typeof existing.id === 'string' ? existing.id : incomingId;
    const currentStatus = existing.status;
    const status =
      statusWeight(entry.status) >= statusWeight(currentStatus) ? entry.status : currentStatus;
    const combined: MatchData = {
      ...existing,
      ...entry,
      id: existingId || entry.id,
      matchedWith: uniqueStrings(existing.matchedWith, entry.matchedWith),
    };
    if (status === 'available' || status === 'pending' || status === 'matched') {
      combined.status = status;
    } else {
      delete combined.status;
    }
    const maxSeats = [existing.seats, entry.seats].filter(
      (value): value is number => typeof value === 'number',
    );
    if (maxSeats.length > 0) combined.seats = Math.max(...maxSeats);
    merged[existingIndex] = combined;

    if (incomingId && existingId) aliases.set(incomingId, existingId);
  }

  return merged.map((entry) => {
    const remap = (id: string): string => aliases.get(id) ?? id;
    const mappedMatches = uniqueStrings(entry.matchedWith).map(remap);
    const requestedDriverId =
      typeof entry.requestedDriverId === 'string'
        ? remap(entry.requestedDriverId)
        : undefined;

    const result = { ...entry };
    if (mappedMatches.length > 0) result.matchedWith = mappedMatches;
    else delete result.matchedWith;
    if (requestedDriverId) result.requestedDriverId = requestedDriverId;
    else delete result.requestedDriverId;
    return result;
  });
};

export const countMatchVolunteers = (data: MatchData): number =>
  toRecords(data.roles).reduce((total, role) => total + toStrings(role.volunteers).length, 0);

export const countMatchCarpoolEntries = (data: MatchData): number =>
  toRecords(data.carpool).length;

export const mergeDuplicateMatchData = (records: MatchData[]): MatchData => {
  const merged = Object.assign({}, ...records);
  const roles = mergeRoles(...records.map((record) => record.roles));
  const carpool = mergeCarpool(...records.map((record) => record.carpool));

  if (roles.length > 0) merged.roles = roles;
  if (carpool.length > 0) merged.carpool = carpool;
  return merged;
};
