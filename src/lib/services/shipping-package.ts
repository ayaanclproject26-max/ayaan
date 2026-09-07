import { ShippingPackageProfile } from "@/types";

export const DIMENSION_TO_METERS = {
  cm: 0.01,
  m: 1.0,
  in: 0.0254,
} as const;

/**
 * Calculate single carton volume in Cubic Meters (CBM).
 */
export function calculateCartonCbm(
  length: number,
  width: number,
  height: number,
  unit: "cm" | "in" | "m" = "cm"
): number {
  if (length <= 0 || width <= 0 || height <= 0) return 0;
  const factor = DIMENSION_TO_METERS[unit] ?? 0.01;
  const lMeters = length * factor;
  const wMeters = width * factor;
  const hMeters = height * factor;
  return Number((lMeters * wMeters * hMeters).toFixed(6));
}

/**
 * Calculate total shipment volume in CBM across all cartons.
 * Example: 3 cartons of 60 x 40 x 30 cm = 0.60 * 0.40 * 0.30 * 3 = 0.216 CBM
 */
export function calculateTotalCbm(
  length: number,
  width: number,
  height: number,
  cartonCount: number,
  unit: "cm" | "in" | "m" = "cm"
): number {
  if (cartonCount < 1) return 0;
  const cartonCbm = calculateCartonCbm(length, width, height, unit);
  return Number((cartonCbm * cartonCount).toFixed(4));
}

/**
 * Validate a list of package profiles for validity, positive values, non-duplicates, and no overlapping ranges.
 */
export function validateShippingPackageProfiles(
  profiles: ShippingPackageProfile[]
): { valid: boolean; error?: string } {
  if (!profiles || profiles.length === 0) {
    return { valid: true };
  }

  const seenExactQuantities = new Set<number>();
  const ranges: Array<[number, number, number]> = [];

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const row = i + 1;

    if (!p.package_quantity || p.package_quantity <= 0) {
      return { valid: false, error: `Profile #${row}: Package quantity must be greater than 0` };
    }

    if (p.quantity_max !== undefined && p.quantity_max !== null && p.quantity_max < p.package_quantity) {
      return { valid: false, error: `Profile #${row}: Maximum quantity (${p.quantity_max}) cannot be less than minimum quantity (${p.package_quantity})` };
    }

    if (!p.carton_count || p.carton_count < 1) {
      return { valid: false, error: `Profile #${row}: Carton count must be at least 1` };
    }

    if (!p.carton_length || p.carton_length <= 0 || !p.carton_width || p.carton_width <= 0 || !p.carton_height || p.carton_height <= 0) {
      return { valid: false, error: `Profile #${row}: Carton length, width, and height must be greater than 0` };
    }

    if (!p.gross_weight || p.gross_weight <= 0) {
      return { valid: false, error: `Profile #${row}: Gross weight must be greater than 0` };
    }

    if (p.net_weight !== undefined && p.net_weight !== null) {
      if (p.net_weight <= 0) {
        return { valid: false, error: `Profile #${row}: Net weight must be greater than 0 if provided` };
      }
      if (p.net_weight > p.gross_weight) {
        return { valid: false, error: `Profile #${row}: Net weight (${p.net_weight}) cannot exceed gross weight (${p.gross_weight})` };
      }
    }

    // Duplicate exact quantities check
    if (p.quantity_max === undefined || p.quantity_max === null) {
      if (seenExactQuantities.has(p.package_quantity)) {
        return { valid: false, error: `Duplicate package profile for exact quantity ${p.package_quantity} pcs` };
      }
      seenExactQuantities.add(p.package_quantity);
    }

    // Overlapping ranges check
    const effectiveMax = p.quantity_max ?? p.package_quantity;
    for (const [existingMin, existingMax, existingRow] of ranges) {
      if (p.package_quantity <= existingMax && effectiveMax >= existingMin) {
        return { valid: false, error: `Profile #${row} [${p.package_quantity}-${effectiveMax}] overlaps with Profile #${existingRow} [${existingMin}-${existingMax}]` };
      }
    }
    ranges.push([p.package_quantity, effectiveMax, row]);
  }

  return { valid: true };
}

/**
 * Find matching shipping package profile for a given quantity.
 */
export function findMatchingShippingProfile(
  profiles: ShippingPackageProfile[],
  quantity: number
): ShippingPackageProfile | null {
  if (!profiles || profiles.length === 0 || quantity <= 0) {
    return null;
  }

  // 1. Exact quantity match
  const exact = profiles.find((p) => (p.is_active !== false) && p.package_quantity === quantity && (p.quantity_max === undefined || p.quantity_max === null));
  if (exact) return exact;

  // 2. Range match
  const range = profiles.find((p) => {
    if (p.is_active === false) return false;
    return p.quantity_max !== undefined && p.quantity_max !== null && quantity >= p.package_quantity && quantity <= p.quantity_max;
  });

  return range || null;
}
