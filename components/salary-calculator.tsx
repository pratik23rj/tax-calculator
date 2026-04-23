"use client";

import { useState } from "react";

import { calculateSalaryBreakdown, type TaxRegime } from "@/lib/tax";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const compositionPalette = ["#2563eb", "#0ea5e9", "#38bdf8"];

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return percentFormatter.format(value);
}

function clampNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function polarToCartesian(center: number, radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians)
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const center = 60;
  const radius = 46;
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  ].join(" ");
}

function SalaryDonut({
  monthlyGross,
  items
}: {
  monthlyGross: number;
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const segments = items.reduce<
    Array<{ label: string; color: string; startAngle: number; endAngle: number }>
  >((result, item) => {
    const previousAngle = result.at(-1)?.endAngle ?? 0;
    const percentage = monthlyGross > 0 ? item.value / monthlyGross : 0;
    const endAngle = previousAngle + percentage * 360;

    result.push({
      label: item.label,
      color: item.color,
      startAngle: previousAngle,
      endAngle
    });

    return result;
  }, []);

  return (
    <div className="relative chart-reveal">
      <svg
        viewBox="0 0 120 120"
        className="mx-auto h-56 w-56 -rotate-90 overflow-visible sm:h-64 sm:w-64"
        aria-label="Salary composition donut chart"
        role="img"
      >
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="rgba(148, 163, 184, 0.12)"
          strokeWidth="12"
        />
        {segments.map((item) => {
          return (
            <path
              key={item.label}
              d={describeArc(item.startAngle, item.endAngle)}
              fill="none"
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth="12"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Monthly gross</span>
        <span className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          {formatCurrency(monthlyGross)}
        </span>
        <span className="mt-2 text-sm text-slate-400">Basic + HRA + other allowance</span>
      </div>
    </div>
  );
}

function AmountField({
  id,
  label,
  value,
  onChange,
  hint
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint: string;
}) {
  return (
    <label htmlFor={id} className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-100">{label}</span>
        <span className="text-xs text-slate-400">{hint}</span>
      </div>
      <div className="group flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 transition duration-300 focus-within:border-blue-500/60 focus-within:bg-white/8">
        <span className="text-sm font-medium text-slate-400">INR</span>
        <input
          id={id}
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(event) => onChange(clampNumber(event.target.value))}
          className="w-full bg-transparent px-3 py-4 text-right text-lg font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </label>
  );
}

function MetricTile({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  maxValue,
  color,
  subtitle
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  subtitle: string;
}) {
  const width = maxValue > 0 ? `${Math.max((value / maxValue) * 100, 10)}%` : "10%";

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-100">{label}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <p className="text-sm font-semibold text-white">{formatCurrency(value)}</p>
      </div>
      <div className="h-3 rounded-full bg-white/6">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.88))`
          }}
        />
      </div>
    </div>
  );
}

function RegimeCard({
  name,
  tax,
  inHand,
  effectiveRate,
  selected,
  isBest,
  accent
}: {
  name: string;
  tax: number;
  inHand: number;
  effectiveRate: number;
  selected: boolean;
  isBest: boolean;
  accent: string;
}) {
  return (
    <div
      className={`mesh-border rounded-[1.8rem] p-5 transition duration-300 ${
        selected ? "bg-white/[0.08]" : "bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">{name}</p>
          <p className="mt-2 text-xs text-slate-400">Estimated annual tax outflow</p>
        </div>
        {isBest ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-200">
            Best fit
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-3xl font-semibold text-white">{formatCurrency(tax)}</p>
      <div className="mt-6 h-px bg-white/10" />
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Monthly in-hand</p>
          <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(inHand)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Effective rate</p>
          <p className="mt-2 text-lg font-semibold" style={{ color: accent }}>
            {formatPercent(effectiveRate)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SalaryCalculator() {
  const [basicSalary, setBasicSalary] = useState(52_000);
  const [hra, setHra] = useState(24_000);
  const [otherAllowance, setOtherAllowance] = useState(14_000);
  const [selectedRegime, setSelectedRegime] = useState<TaxRegime>("new");

  const breakdown = calculateSalaryBreakdown({
    basicSalary,
    hra,
    otherAllowance,
    selectedRegime
  });

  const selectedResult =
    breakdown.selectedRegime === "new" ? breakdown.newRegime : breakdown.oldRegime;
  const maxTax = Math.max(breakdown.oldRegime.totalTax, breakdown.newRegime.totalTax, 1);
  const composition = [
    { label: "Basic salary", value: basicSalary, color: compositionPalette[0] },
    { label: "HRA", value: hra, color: compositionPalette[1] },
    { label: "Other allowance", value: otherAllowance, color: compositionPalette[2] }
  ];

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.94fr)_minmax(0,1.46fr)]">
        <section className="fade-up lg:sticky lg:top-6 lg:self-start">
          <div className="panel sheen relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-blue-200/80">
                  In-hand salary
                </p>
                <h1 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Compare India&apos;s old and new tax regimes in one workspace.
                </h1>
              </div>
              <div className="hidden rounded-full border border-blue-400/20 bg-blue-500/12 px-3 py-2 text-xs font-medium text-blue-100 sm:block">
                AY 2026-27
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
              Enter monthly salary components and instantly see annual tax, take-home pay, and
              which regime leaves more money with you.
            </p>

            <div className="mt-7 grid gap-5">
              <AmountField
                id="basicSalary"
                label="Basic salary"
                value={basicSalary}
                onChange={setBasicSalary}
                hint="Per month"
              />
              <AmountField id="hra" label="HRA" value={hra} onChange={setHra} hint="Per month" />
              <AmountField
                id="otherAllowance"
                label="Other allowance"
                value={otherAllowance}
                onChange={setOtherAllowance}
                hint="Per month"
              />
            </div>

            <div className="mt-7 space-y-3">
              <p className="text-sm font-medium text-slate-100">Highlight a regime</p>
              <div className="grid grid-cols-2 gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-2">
                {(["old", "new"] as TaxRegime[]).map((regime) => {
                  const active = selectedRegime === regime;

                  return (
                    <button
                      key={regime}
                      type="button"
                      onClick={() => setSelectedRegime(regime)}
                      className={`rounded-[1rem] px-4 py-3 text-sm font-semibold capitalize transition ${
                        active
                          ? "bg-blue-600 text-white shadow-[0_12px_36px_rgba(37,99,235,0.35)]"
                          : "text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      {regime} regime
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 rounded-[1.6rem] border border-blue-400/15 bg-blue-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-blue-100/85">Selected view</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(selectedResult.monthlyInHand)}
              </p>
              <p className="mt-2 text-sm text-blue-100/80">
                Estimated monthly in-hand after tax under the {selectedRegime} regime.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
              This estimator includes standard deduction and current slab/rebate rules. HRA is
              counted as salary income here and HRA exemption is not subtracted because rent and
              city details are not collected.
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="fade-up panel rounded-[2rem] p-6 sm:p-7" style={{ animationDelay: "120ms" }}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Summary</p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  {breakdown.bestRegime === "new" ? "New regime" : "Old regime"} is currently more
                  efficient.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Based on your current monthly structure, the better option saves{" "}
                  <span className="font-semibold text-white">
                    {formatCurrency(breakdown.annualSavings)}
                  </span>{" "}
                  each year, or {formatCurrency(breakdown.monthlySavings)} per month.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                <MetricTile label="Annual gross" value={formatCurrency(breakdown.annualGross)} />
                <MetricTile
                  label="Taxable income"
                  value={formatCurrency(selectedResult.taxableIncome)}
                  accent="text-blue-300"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="fade-up panel rounded-[2rem] p-6 sm:p-7" style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-slate-400">
                    Salary composition
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Gross income mix</h3>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">
                  Monthly view
                </div>
              </div>

              <div className="mt-6">
                <SalaryDonut monthlyGross={breakdown.monthlyGross} items={composition} />
              </div>

              <div className="mt-6 space-y-3">
                {composition.map((item) => {
                  const percentage =
                    breakdown.monthlyGross > 0 ? item.value / breakdown.monthlyGross : 0;

                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-slate-400">{formatPercent(percentage)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fade-up panel rounded-[2rem] p-6 sm:p-7" style={{ animationDelay: "240ms" }}>
              <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Tax comparison</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Annual deduction outlook</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Lower bars are better here. The comparison uses standard deduction, rebate under
                Section 87A, cess, and surcharge where applicable.
              </p>

              <div className="mt-8 space-y-6">
                <ComparisonBar
                  label="Old regime"
                  value={breakdown.oldRegime.totalTax}
                  maxValue={maxTax}
                  color="#38bdf8"
                  subtitle={`In-hand ${formatCurrency(breakdown.oldRegime.monthlyInHand)} / month`}
                />
                <ComparisonBar
                  label="New regime"
                  value={breakdown.newRegime.totalTax}
                  maxValue={maxTax}
                  color="#2563eb"
                  subtitle={`In-hand ${formatCurrency(breakdown.newRegime.monthlyInHand)} / month`}
                />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Selected regime tax"
                  value={formatCurrency(selectedResult.totalTax)}
                  accent="text-white"
                />
                <MetricTile
                  label="Effective tax rate"
                  value={formatPercent(selectedResult.effectiveRate)}
                  accent="text-blue-300"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="fade-up panel rounded-[2rem] p-6 sm:p-7" style={{ animationDelay: "300ms" }}>
              <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Regime cards</p>
              <div className="mt-6 grid gap-4">
                <RegimeCard
                  name="Old regime"
                  tax={breakdown.oldRegime.totalTax}
                  inHand={breakdown.oldRegime.monthlyInHand}
                  effectiveRate={breakdown.oldRegime.effectiveRate}
                  selected={selectedRegime === "old"}
                  isBest={breakdown.bestRegime === "old"}
                  accent="#38bdf8"
                />
                <RegimeCard
                  name="New regime"
                  tax={breakdown.newRegime.totalTax}
                  inHand={breakdown.newRegime.monthlyInHand}
                  effectiveRate={breakdown.newRegime.effectiveRate}
                  selected={selectedRegime === "new"}
                  isBest={breakdown.bestRegime === "new"}
                  accent="#60a5fa"
                />
              </div>
            </div>

            <div className="fade-up panel rounded-[2rem] p-6 sm:p-7" style={{ animationDelay: "360ms" }}>
              <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Calculation notes</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">Standard deduction applied</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Old regime uses {formatCurrency(breakdown.oldRegime.standardDeduction)} and new
                    regime uses {formatCurrency(breakdown.newRegime.standardDeduction)}.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">Rebate logic</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    The app applies Section 87A rebate up to {formatCurrency(12_500)} under old
                    regime and {formatCurrency(60_000)} under new regime when eligible.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">Simplification</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This version does not model HRA exemption, 80C/80D deductions, home-loan
                    benefits, or marginal relief. It is designed as a clean salary estimator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
