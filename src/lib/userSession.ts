const USER_ID_KEY = 'world-discovery-user-id';

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'server-anon';

  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(USER_ID_KEY, generated);
  return generated;
}
