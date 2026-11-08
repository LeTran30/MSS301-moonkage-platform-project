/**
 * The port between `entities/dispute` and `entities/payment`.
 *
 * `entities/dispute` must not import `entities/payment` directly
 * (package-architecture §3, "Tầng 4: entities" — cross-entity links go through
 * a `@x` port that only exports what the other side needs).
 *
 * Why the dispute needs the ledger: the backend names the money of a dispute
 * nowhere. `DisputeResponse` carries the reason, the description and the
 * decision, but the amount held in escrow lives in the payment ledger
 * (`GET /api/ledgers/{orderId}` → `held`). AC-49.3 caps the refund at exactly
 * that amount, so the arbitration screen has to read it from there.
 */
export { ledgerApi } from '../api/ledgerApi';
export type { LedgerDto } from '../api/ledgerApi';
