export const getFirstDisallowedKey = (
  payload: Record<string, unknown>,
  allowedKeys: readonly string[],
): string | null => {
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.includes(key)) {
      return key;
    }
  }

  return null;
};