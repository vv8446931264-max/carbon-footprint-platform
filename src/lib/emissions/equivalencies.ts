import { TRANSPORT_FACTORS } from "./factors";

/**
 * Translates an abstract kg-CO2e figure into relatable, everyday equivalents.
 * People reason far better about "12 trees for a year" or "1,800 km not driven"
 * than about kilograms of an invisible gas, so these power the "what your saving
 * means" moments. Factors are published averages, kept transparent and testable.
 */
export interface Equivalencies {
  /** Trees absorbing CO2 for a year (a mature tree fixes ~21 kg/yr). */
  treesForAYear: number;
  /** Kilometres in an average petrol car avoided. */
  carKmAvoided: number;
  /** Smartphone charges (EPA: ~0.00822 kg CO2e per charge). */
  phoneCharges: number;
}

const KG_PER_TREE_YEAR = 21;
const KG_PER_PHONE_CHARGE = 0.00822;

export function carbonEquivalencies(kgCo2e: number): Equivalencies {
  const kg = Math.max(kgCo2e, 0);
  return {
    treesForAYear: round(kg / KG_PER_TREE_YEAR, 1),
    carKmAvoided: Math.round(kg / TRANSPORT_FACTORS.car_petrol),
    phoneCharges: Math.round(kg / KG_PER_PHONE_CHARGE),
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
