export function createSession({ id, startedAt, endedAt = null }) {
  return {
    id,
    startedAt,
    endedAt,
  };
}
