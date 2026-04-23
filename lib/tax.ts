export type TaxRegime = "old" | "new";

type TaxSlab = {
  upTo: number | null;
  rate: number;
};

type SurchargeSlab = {
  threshold: number;
  rate: number;
};

type RegimeResult = {
  taxableIncome: number;
  baseTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  monthlyInHand: number;
  annualInHand: number;
  effectiveRate: number;
  standardDeduction: number;
};

export type SalaryBreakdown = {
  monthlyGross: number;
  annualGross: number;
  selectedRegime: TaxRegime;
  oldRegime: RegimeResult;
  newRegime: RegimeResult;
  bestRegime: TaxRegime;
  annualSavings: number;
  monthlySavings: number;
};

const OLD_STANDARD_DEDUCTION = 50_000;
const NEW_STANDARD_DEDUCTION = 75_000;
const CESS_RATE = 0.04;

const OLD_SLABS: TaxSlab[] = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: null, rate: 0.3 }
];

const NEW_SLABS: TaxSlab[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: null, rate: 0.3 }
];

const OLD_SURCHARGES: SurchargeSlab[] = [
  { threshold: 5_000_000, rate: 0.1 },
  { threshold: 10_000_000, rate: 0.15 },
  { threshold: 20_000_000, rate: 0.25 },
  { threshold: 50_000_000, rate: 0.37 }
];

const NEW_SURCHARGES: SurchargeSlab[] = [
  { threshold: 5_000_000, rate: 0.1 },
  { threshold: 10_000_000, rate: 0.15 },
  { threshold: 20_000_000, rate: 0.25 },
  { threshold: 50_000_000, rate: 0.25 }
];

function calculateSlabTax(income: number, slabs: TaxSlab[]) {
  let remaining = income;
  let lowerLimit = 0;
  let tax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) {
      break;
    }

    const upperLimit = slab.upTo ?? Number.POSITIVE_INFINITY;
    const taxableAmount = Math.min(remaining, upperLimit - lowerLimit);

    if (taxableAmount > 0) {
      tax += taxableAmount * slab.rate;
      remaining -= taxableAmount;
    }

    lowerLimit = upperLimit;
  }

  return tax;
}

function calculateSurcharge(income: number, baseTax: number, surcharges: SurchargeSlab[]) {
  let applicableRate = 0;

  for (const slab of surcharges) {
    if (income > slab.threshold) {
      applicableRate = slab.rate;
    }
  }

  return baseTax * applicableRate;
}

function roundCurrency(value: number) {
  return Math.round(value);
}

function calculateRegime(annualGross: number, regime: TaxRegime): RegimeResult {
  const standardDeduction =
    regime === "new" ? NEW_STANDARD_DEDUCTION : OLD_STANDARD_DEDUCTION;
  const taxableIncome = Math.max(annualGross - standardDeduction, 0);
  const baseTax = calculateSlabTax(taxableIncome, regime === "new" ? NEW_SLABS : OLD_SLABS);
  const rebateLimit = regime === "new" ? 60_000 : 12_500;
  const rebateThreshold = regime === "new" ? 1_200_000 : 500_000;
  const rebate = taxableIncome <= rebateThreshold ? Math.min(baseTax, rebateLimit) : 0;
  const taxAfterRebate = Math.max(baseTax - rebate, 0);
  const surcharge = calculateSurcharge(
    taxableIncome,
    taxAfterRebate,
    regime === "new" ? NEW_SURCHARGES : OLD_SURCHARGES
  );
  const cess = (taxAfterRebate + surcharge) * CESS_RATE;
  const totalTax = taxAfterRebate + surcharge + cess;
  const annualInHand = annualGross - totalTax;

  return {
    taxableIncome: roundCurrency(taxableIncome),
    baseTax: roundCurrency(baseTax),
    rebate: roundCurrency(rebate),
    surcharge: roundCurrency(surcharge),
    cess: roundCurrency(cess),
    totalTax: roundCurrency(totalTax),
    annualInHand: roundCurrency(annualInHand),
    monthlyInHand: roundCurrency(annualInHand / 12),
    effectiveRate: annualGross > 0 ? totalTax / annualGross : 0,
    standardDeduction
  };
}

export function calculateSalaryBreakdown({
  basicSalary,
  hra,
  otherAllowance,
  selectedRegime
}: {
  basicSalary: number;
  hra: number;
  otherAllowance: number;
  selectedRegime: TaxRegime;
}): SalaryBreakdown {
  const monthlyGross = basicSalary + hra + otherAllowance;
  const annualGross = monthlyGross * 12;
  const oldRegime = calculateRegime(annualGross, "old");
  const newRegime = calculateRegime(annualGross, "new");
  const bestRegime = oldRegime.totalTax <= newRegime.totalTax ? "old" : "new";
  const annualSavings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

  return {
    monthlyGross: roundCurrency(monthlyGross),
    annualGross: roundCurrency(annualGross),
    selectedRegime,
    oldRegime,
    newRegime,
    bestRegime,
    annualSavings: roundCurrency(annualSavings),
    monthlySavings: roundCurrency(annualSavings / 12)
  };
}
