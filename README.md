# Tax Calculator

A responsive Next.js + Tailwind app for estimating in-hand salary under India's old and new tax regimes.

## Run locally

```bash
pnpm install
pnpm dev
```

## What this app includes

- Monthly input for `Basic Salary`, `HRA`, and `Other Allowance`
- Old vs new regime comparison
- Monthly and annual in-hand estimates
- Salary composition donut chart
- Tax comparison bars
- Responsive split layout for desktop and mobile

## Calculation assumptions

- Gross income is calculated from monthly salary components multiplied by 12.
- Standard deduction is applied before slab calculation.
- Section 87A rebate and 4% cess are included.
- HRA is treated as part of salary income and HRA exemption is not deducted because rent/city inputs are not collected.
- Surcharge is applied where thresholds are crossed, but marginal relief is not modeled.

## Sources used for slab/rebate rules

- Income Tax Department, salaried individuals AY 2026-27: [https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1)
- Standard deduction reference used in the app notes: [https://cleartax.in/guide/taxes](https://cleartax.in/guide/taxes)
