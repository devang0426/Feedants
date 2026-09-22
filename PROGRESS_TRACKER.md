# Progress Tracker

Living log of everything built for the Feedants Competition Details assignment. Newest entries at the bottom of each day. Update this file with every meaningful change (see the template at the end).

Repo: https://github.com/devang0426/Feedants

---

## Status at a glance

| Area | State | Notes |
| --- | --- | --- |
| Backend API | ✅ Working | Express + Mongoose, 18 tests passing |
| Database | ✅ Atlas configured | In-memory fallback when `MONGODB_URI` is empty |
| Mobile app | ✅ Working in Expo Go | Sign-in, 5 tabs, details screen, payments |
| Payments | ✅ Razorpay test keys configured | Real orders verified from the backend; WebView checkout not yet tried on device |
| Design fidelity | ✅ Poppins, tokens sampled from PNG | Needs on-device visual check |
| APK build | ⚙️ Config ready (`mobile/eas.json`) | Requires an Expo account to run |
| Screen recording | ⏳ Not done | Required by the assignment |
| Atlas password rotation | ⏳ Not done | Password was pasted in chat once |

---

## Changelog

### 2026-09-22

#### Project setup
- Read the assignment (`prd.md`) and design reference (`Objective_Page.png`).
- Scaffolded `backend/` (Node 22, Express 4, Mongoose 8, Zod, JWT, Pino, Vitest) and `mobile/` (Expo SDK 57, TypeScript).
- Added root `package.json` helper scripts, `docker-compose.yml` for an optional local MongoDB, root `.gitignore`.

#### Backend: data model and business rules
- Models: `User`, `Competition` (localised `{en, hi}` fields, integer paise, `capacity.total/booked`, schedule sub-document with cross-field validation, optimistic concurrency), `Registration` (unique `(competitionId, userId)`), `Submission` (one replaceable entry per user).
- `services/lifecycle.js`: pure derivation of phase, windows, countdown target, urgency, and the `canRegister` / `canSubmit` / `canCancel` guards from the schedule plus server time. Nothing is stored, so state can never go stale.
- `services/competitionService.js`: screen view-model (`GET /competitions/:idOrSlug`) including a server-decided `viewer.primaryAction`.
- `services/registrationService.js`: reservation flow with per-user de-duplication (unique index), guarded atomic `$inc` spot claim, compensation on failure, TTL reservations, status-guarded confirm/cancel, sweeper for expired holds.
- Middleware: JWT auth (optional/required), admin key, Zod validation, language resolution, consistent error envelope with machine-readable codes, rate limiting keyed by user.
- Seed data: 6 demo users and 7 competitions covering every lifecycle phase, dates relative to boot.
- In-memory MongoDB fallback for zero-setup development.

#### Backend: tests
- `registration.test.js`: 200 users racing for 20 spots → exactly 20 succeed; one user hammering 25 times holds one spot and is never told "full"; free vs paid flows; expiry; cancel; auth; localisation.
- `lifecycle.test.js`: phase, countdown, guard unit tests.
- Fixed: rate limiter was tripping in the race test → keyed by user, skipped in tests. Restructured registration so duplicates are deduped *before* capacity is touched (introduced `pending` / `failed` statuses).

#### Mobile: Competition Details screen
- Typed API client with clock-offset sync from `serverTime`, TanStack Query hooks (15 s polling, refetch on focus, refetch when a countdown boundary passes, mutation results written straight into the cache).
- Components matching the design: summary card with spots progress, judge card, countdown banner, important dates grid, previous winners carousel, About/Judging/Rules tabs with "View more", rewards table, disclaimer, payment info, refer & earn (copy + share), testimonials row, ad placeholder, server-driven primary CTA, bottom tab bar.
- Payment sheet (mock) and submission sheet, cancel confirmation.
- ENG / हिंदी toggle: UI strings in the app, content localised by the backend.

#### Environment
- Added MongoDB Atlas URI to `backend/.env` (gitignored), generated a random `JWT_SECRET`, removed unused username/password lines.
- Added web preview support (`react-dom`, `react-native-web`) as a fallback when no phone/emulator is available.

#### Razorpay
- `services/paymentService.js`: real Orders API + HMAC signature verification when keys are set, mock mode otherwise; secret never leaves the server.
- Order is created only after the spot is held; failures release the spot.
- `POST /webhooks/razorpay` with raw-body signature check; idempotent with the checkout callback; late payments flagged `needsRefund`.
- Mobile `RazorpayCheckout.tsx`: Standard Checkout in a WebView (works in Expo Go); UPI/bank deep links handed to the OS. Payment sheet switches on `payment.mode`.
- 5 new payment/webhook tests (18 total).
- Demo card `4100 2800 0000 1007` shown in README and inside the checkout sheet when a test key is used.

#### UI/UX pass
- Poppins typeface via a `Text` wrapper mapping `fontWeight` → font face; per-weight subpath imports (5 faces instead of 18).
- Layout-matching skeleton loader; non-blocking toasts with haptics; "could not refresh" banner keeping last good data; live "spot held mm:ss" chip; red "all spots booked" chip; CTA bar elevation; list press feedback and empty state.

#### Git
- Initialised the root repo (removed the nested repo the Expo scaffold created), verified no `.env`/`node_modules` staged, first push to `main`.

#### App shell (this entry)
- Sign-in screen (e-mail + name, demo account chips) replaces silent auto-login; sign-out from Profile; session restored from saved token.
- Bottom tabs are all functional: **Home** (closing-soon carousel with live countdowns, open now, upcoming, results out), **Explore** (debounced search, category and phase filters), **Create** (organiser placeholder), **Competitions** (full list), **Profile** (identity, language, referral code/link/earnings, my registrations with status chips).
- Backend: `GET /competitions?q=&category=&phase=`, `GET /competitions/categories`, `GET /me/registrations`.
- Shared `CompetitionRow` component; navigation restructured to stack → tabs with a custom tab bar; deep links kept.
- `mobile/eas.json` with an APK `preview` profile.
- This tracker file.
- Fixed: Razorpay test keys added to `backend/.env` made the test suite hit the real gateway and reject the mock signature. `vitest.config.js` now pins `MONGODB_URI` and the Razorpay keys to empty so tests never depend on a developer's `.env`.

---

## Verification log

| Date | Check | Result |
| --- | --- | --- |
| 2026-09-22 | `npm test` (backend) | 18/18 passing |
| 2026-09-22 | HTTP smoke tests (register, confirm, cancel, full, closed, admin, validation) | All expected codes |
| 2026-09-22 | Atlas connection + seed | Connected, 7 competitions seeded |
| 2026-09-22 | `tsc --noEmit` (mobile) | Clean |
| 2026-09-22 | `expo export` Android + web | Bundles successfully |
| 2026-09-22 | Real Razorpay order creation with test keys (`POST /registrations` → `order_…`, mock signature rejected) | Passed |
| 2026-09-22 | New endpoints (`/competitions?q=&phase=`, `/competitions/categories`, `/me/registrations`) against Atlas | Passed |
| — | On-device visual check vs design | Not yet done |
| — | Razorpay WebView checkout on a device | Not yet done |

---

## Known gaps / backlog

- [ ] Record the screen demo (register → pay → spots drop → upload → language toggle → full competition).
- [ ] Rotate the Atlas database user's password.
- [ ] Verify the Razorpay WebView checkout end to end on a device (keys are configured); set up the webhook via ngrok.
- [ ] Build an APK: `npm i -g eas-cli`, `eas login`, set `EXPO_PUBLIC_API_URL` in `eas.json`, `eas build -p android --profile preview`.
- [ ] Deploy the backend (Render/Railway/Fly) so the APK works off-LAN.
- [ ] Organiser flow (Create tab) and results/leaderboard screen.
- [ ] Automatic refunds on cancel and for `needsRefund` payments.
- [ ] Component tests (React Native Testing Library) and a Detox e2e flow.

---

## How to log a change

Append under today's date (create the heading if missing):

```
#### <Area>
- What changed and why (one line each).
- Files touched if non-obvious.
- Verification: tests run / manual check.
```

Update the status table and verification log when something moves.
