export function normalizeWaId(input: string): string {
  return String(input ?? '').replace(/\D/g, '');
}

