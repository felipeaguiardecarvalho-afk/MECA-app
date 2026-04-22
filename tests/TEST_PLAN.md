# MECA App — Test Plan

## 1. Scope

This plan covers the critical paths of the MECA diagnostic platform:

| Layer | Tool | Directory |
|-------|------|-----------|
| Unit | Vitest | `src/__tests__/` |
| E2E / API | Playwright | `e2e/` |

## 2. What We Test

### 2.1 Diagnostic Engine (unit)

| Case | Expectation |
|------|-------------|
| All neutral (3) answers | Scores near 50, archetype "Perfil Equilibrado" |
| All max (5) answers | Scores = 100, dominant archetype |
| All min (1) answers | Scores = 0, dominant archetype |
| Partial / missing answers | Throws error |
| Direction = avg(mentalidade, engajamento) | Derived correctly |
| Capacity = avg(cultura, performance) | Derived correctly |
| Archetype with spread < 10 | "Perfil Equilibrado" |
| Archetype with clear dominant | Named archetype matching highest pillar |

### 2.2 Archetype Engine (unit)

| Case | Expectation |
|------|-------------|
| High M+C, low E+A (top-left) | "Potencial Disperso" |
| All high (top-right) | "Performance Alavancada" |
| All low (bottom-left) | "Risco Estrutural" |
| Low M+C, high E+A (bottom-right) | "Executor Sobrecarregado" |
| Weakest pillar detection | Returns correct key |

### 2.3 Access Control (unit)

| Case | Expectation |
|------|-------------|
| Canonical master email | `isAdmin` = true |
| Canonical master, different case | `isAdmin` = true |
| Arbitrary email | `isAdmin` = false |
| null / undefined / empty | `isAdmin` = false |

### 2.4 Benchmark (unit)

| Case | Expectation |
|------|-------------|
| Reference scores defined | All 6 keys present, values > 0 |
| Gap calculation | score - benchmark for each metric |

### 2.5 Evolution (unit)

| Case | Expectation |
|------|-------------|
| No prior results | All deltas = 0 |
| With prior result | Correct per-metric deltas |

### 2.6 Action Plan (unit)

| Case | Expectation |
|------|-------------|
| Each pillar as bottleneck | Correct plan selected |
| Tie-breaking | Mentalidade > Engajamento > Cultura > Performance |
| Distinct titles per pillar | 4 unique titles |

### 2.7 API — POST /api/score (E2E via Playwright `request`)

| Case | Expectation |
|------|-------------|
| Valid payload (auth off mode) | 200, `ok: true`, `id` and `created_at` present |
| Invalid JSON | 400 |
| Missing answers | 400 |
| Values out of range | 400 |

### 2.8 API — GET /api/user/history (E2E via Playwright `request`)

| Case | Expectation |
|------|-------------|
| Normal request (auth off) | 200, `ok: true`, `rows` is array |
| Rows sorted DESC | First row has latest `created_at` |

### 2.9 API — POST /api/auth/magic-link (E2E via Playwright `request`)

| Case | Expectation |
|------|-------------|
| Non-master email | `bypass: false` |

### 2.10 E2E Flow (Playwright browser)

| Step | Expectation |
|------|-------------|
| Open /assessment | Page loads (E2E_INSTANT_DIAGNOSTIC auto-submits) |
| Redirect to /dashboard | Dashboard with profile visible |
| Smoke all critical routes | HTTP 2xx/3xx, no server errors |
| Login page a11y | No critical axe-core violations |

## 3. What We Do NOT Test Here

- Real Supabase authentication (requires live session tokens)
- Real e-mail delivery (rate limits, SMTP)
- Browser-specific CSS rendering
- Performance benchmarks

## 4. Test Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `makeAnswers(value)` | `src/__tests__/helpers/diagnostic.ts` | Generate 60-answer payload |
| `makeAnswersWithPillar(...)` | same | Custom per-pillar values |
| `expectPageOpensWithoutServerError` | `e2e/helpers/page-load.ts` | Smoke check |

## 5. Running

```bash
# Unit tests
npm run test

# E2E + API tests (starts server on :3004 with auth off)
npm run test:e2e

# Full verification (lint + unit + e2e)
npm run verify
```

## 6. CI

GitHub Actions workflow at `.github/workflows/uat.yml` runs `npm run verify` on push/PR.
