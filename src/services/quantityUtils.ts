/**
 * Standardized food weight, serving, and environmental conversion utilities.
 *
 * FAO & WRAP Standard:
 * - 1 standard meal portion ≈ 0.42 kg (420g) of edible food.
 * - 1 kg food waste diverted from landfill saves ≈ 2.5 kg CO2e emissions.
 *
 * Commercial packaging conversions:
 * - 'kg': direct weight.
 * - 'portions': 1 portion = 0.42 kg.
 * - 'boxes': 1 meal box = 1 individual meal portion = 0.42 kg.
 * - 'trays': 1 standard catering gastro-tray (shallow full-size) ≈ 12 meal portions ≈ 5.0 kg.
 */

export function calculateServings(quantity: number, unit: 'kg' | 'portions' | 'boxes' | 'trays'): number {
  if (quantity <= 0) return 0;
  switch (unit) {
    case 'portions':
    case 'boxes':
      return Math.round(quantity);
    case 'trays':
      return Math.round(quantity * 12);
    case 'kg':
    default:
      return Math.round(quantity / 0.42);
  }
}

export function calculateEstimatedKg(
  quantity: number,
  unit: 'kg' | 'portions' | 'boxes' | 'trays',
  servingsCount?: number
): number {
  if (quantity <= 0) return 0;
  if (unit === 'kg') return Math.round(quantity * 10) / 10;
  if (unit === 'trays') return Math.round(quantity * 5.0 * 10) / 10;
  // portions or boxes
  const servings = servingsCount && servingsCount > 0 ? servingsCount : calculateServings(quantity, unit);
  return Math.round(servings * 0.42 * 10) / 10;
}

export function calculateCo2eAvoided(kg: number): number {
  return Math.round(kg * 2.5);
}
