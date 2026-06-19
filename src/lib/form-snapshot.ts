/** Shallow JSON equality for plain form snapshots (objects/arrays of primitives). */
export function formsEqual<T>(current: T, baseline: T): boolean {
  return JSON.stringify(current) === JSON.stringify(baseline);
}

/**
 * Returns true when save should be allowed in edit mode:
 * - create mode: always true (validation handled separately)
 * - edit mode: true only when current values differ from the loaded snapshot
 */
export function hasEditChanges<T>(
  isEdit: boolean,
  current: T,
  baseline: T | null | undefined,
): boolean {
  if (!isEdit) {
    return true;
  }
  if (baseline == null) {
    return false;
  }
  return !formsEqual(current, baseline);
}
