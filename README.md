# Feedants – Competition Details (Full-Stack Module)

A production-style implementation of the **Competition Details** screen from the Feedants design reference, built as a working feature rather than a static mock-up.

| Layer    | Stack                                                                   |
| -------- | ----------------------------------------------------------------------- |
| Mobile   | React Native (Expo SDK 57, TypeScript), React Navigation, TanStack Query |
| Backend  | Node.js 20+, Express 4, Mongoose 8, Zod, JWT, Pino                       |
| Database | MongoDB 6+ (auto-starts an in-memory instance if none is configured)     |
| Tests    | Vitest + Supertest + mongodb-memory-server (25 tests incl. a 200-user race) |

```
p8/
├── backend/            Express API (ESM)
│   ├── src/models      Mongoose schemas (User, Competition, Registration, Submission)
│   ├── src/services    Business rules: lifecycle.js (pure), registrationService.js (concurrency), ...
│   ├── src/controllers Zod schemas + thin HTTP handlers
│   ├── src/routes      Route table, auth + rate limiting
│   ├── src/jobs        Reservation sweeper
│   ├── src/seed        Demo data in every lifecycle phase
│   └── tests           Concurrency, lifecycle and API tests
├── mobile/             Expo app
│   └── src
│       ├── api         Typed client, view-model types, server-clock sync
│       ├── components  ui/ primitives + competition/ screen sections
│       ├── hooks       useCompetitionDetails (polling), useCountdown (server-corrected)
│       ├── i18n        ENG / हिंदी UI strings
│       └── screens     CompetitionDetailsScreen, CompetitionsListScreen
├── docker-compose.yml  Optional persistent MongoDB
└── Objective_Page.png  Design reference
```

---

## 1. Running the project

### Prerequisites

- Node.js **20 or newer** and npm
- For the app: Expo Go on a phone, or an Android emulator / iOS simulator
- MongoDB is **optional** (see below)

### Backend

```bash
cd backend
npm install
cp .env.example .env      # defaults work out of the box
npm run dev               # http://localhost:4000/api/v1
```

With `MONGODB_URI` empty (the default) the server starts an **in-memory MongoDB** and seeds demo data on every boot, so nothing needs to be installed. For a persistent database either run `docker compose up -d` from the repo root and set `MONGODB_URI=mongodb://localhost:27017/feedants`, or point it at Atlas. A persistent database is seeded automatically when empty; `npm run seed` (or `POST /api/v1/admin/seed`) resets it.

```bash
npm test                  # 25 tests, ~20 s (downloads a MongoDB binary on first run)
```

### Mobile app

```bash
cd mobile
npm install
cp .env.example .env      # optional
npx expo start            # press a (Android), i (iOS) or scan the QR with Expo Go
```

The API URL is auto-detected: on a physical phone the app uses the LAN address of the Expo dev server (your computer must be reachable on port 4000 – allow it through the Windows firewall), the Android emulator uses `10.0.2.2`, the iOS simulator uses `localhost`. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to override.

The app starts on a **sign-in screen**. Tap one of the demo account cards to sign in with a single click; each card says what that account is useful for demonstrating (for example, one is not yet registered so you can run the full register and pay flow, another is already registered). "Use another e-mail" reveals a manual form. No password is required in this demo. Sign out from the **Profile** tab to switch accounts. After sign-in:

| Tab | What it does |
| --- | --- |
| **Home** | Closing-soon carousel with live countdowns, open now, upcoming, results out |
| **Explore** | Search across title, judge and category |
| **+** | Organiser placeholder ("coming soon") |
| **Competitions** | All seven seeded competitions, every lifecycle state (open, closing in hours, full, upcoming, submissions open, judging, results out) |
| **Profile** | Identity, language, referral code/link/earnings, my registrations with status, sign out |

Tap any competition to open the **Competition Details** screen from the design (`feedants-classical-dance` is the one that matches the reference). Sign out and sign in as another demo user (e.g. `asha@feedants.app`) to watch spots-left and registration state stay consistent across users.

Progress and change history: [PROGRESS_TRACKER.md](PROGRESS_TRACKER.md).

### Building an installable APK

```bash
npm i -g eas-cli
cd mobile && eas login
# set EXPO_PUBLIC_API_URL in eas.json to your deployed backend
eas build -p android --profile preview      # produces an .apk download link
```

The `preview` profile in `mobile/eas.json` builds an APK for sideloading; `production` builds an AAB for the Play Store. The backend must be reachable from the internet for a built app (deploy it to Render/Railway/Fly, or tunnel with ngrok for a quick test).

### Environment variables

**backend/.env**

| Variable                        | Default                  | Purpose                                                        |
| ------------------------------- | ------------------------ | -------------------------------------------------------------- |
| `PORT`                          | `4000`                   | HTTP port                                                      |
| `NODE_ENV`                      | `development`            | `production` requires `MONGODB_URI`                            |
| `MONGODB_URI`                   | *(empty → in-memory)*    | MongoDB connection string                                      |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | `dev-secret` / `7d`      | Token signing                                                  |
| `ADMIN_API_KEY`                 | `admin-dev-key`          | `X-Admin-Key` header for admin endpoints                       |
| `RESERVATION_TTL_SECONDS`       | `600`                    | How long an unpaid spot is held                                |
| `RESERVATION_SWEEP_INTERVAL_MS` | `15000`                  | Sweeper cadence                                                |
| `CORS_ORIGINS`                  | `*`                      | Comma-separated allow-list                                     |
| `REFERRAL_BASE_URL`             | `https://feedants.com/r` | Prefix for referral links                                      |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | *(empty → mock checkout)* | Razorpay test/live API keys (Dashboard → Settings → API Keys) |
| `RAZORPAY_WEBHOOK_SECRET`       | *(empty)*                | Secret set when creating the webhook in the Razorpay dashboard |

**mobile/.env**

| Variable                                        | Purpose                                             |
| ----------------------------------------------- | --------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Backend base URL (optional, auto-detected otherwise) |

---

## 2. API

Base path `/api/v1`. Every response is `{ ok, data | error, serverTime }`; errors carry a stable `code` the app branches on. Content is localised with `?lang=en|hi` (or `Accept-Language`).

| Method   | Path                                     | Auth   | Purpose                                                   |
| -------- | ---------------------------------------- | ------ | --------------------------------------------------------- |
| `POST`   | `/auth/demo-login`                       | –      | `{ email, name? }` → JWT (stand-in for OTP/OAuth)          |
| `GET`    | `/auth/me`                               | user   | Current user + referral link                               |
| `GET`    | `/auth/demo-accounts`                    | -      | Seeded demo accounts for one-click sign in (dev only)      |
| `GET`    | `/me/registrations`                      | user   | The user's registrations with competition summaries        |
| `GET`    | `/competitions?q=&category=&phase=`      | opt.   | Card list with derived phase and capacity, searchable      |
| `GET`    | `/competitions/categories`               | –      | Distinct categories for filter chips                       |
| `GET`    | `/competitions/:idOrSlug`                | opt.   | **Screen view-model** incl. `viewer` state & primary action |
| `POST`   | `/competitions/:id/registrations`        | user   | Reserve a spot (free → confirmed; paid → payment order)    |
| `POST`   | `/competitions/:id/registrations/confirm`| user   | `{ paymentId, signature }` → confirmed                     |
| `DELETE` | `/competitions/:id/registrations`        | user   | Cancel and release the spot                                |
| `PUT`    | `/competitions/:id/submissions`          | user   | Create/replace the participant's entry                     |
| `PATCH`  | `/admin/competitions/:id`                | admin  | Change status / schedule / capacity (used to demo phases)  |
| `POST`   | `/admin/seed`                            | admin  | Reset demo data                                            |
| `POST`   | `/webhooks/razorpay`                     | HMAC   | Razorpay `payment.captured` webhook (raw-body signature)   |

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `COMPETITION_NOT_FOUND`, `COMPETITION_NOT_PUBLISHED`, `REGISTRATION_NOT_OPEN`, `REGISTRATION_CLOSED`, `COMPETITION_FULL`, `ALREADY_REGISTERED`, `REGISTRATION_IN_PROGRESS`, `RESERVATION_EXPIRED`, `RESERVATION_NOT_ACTIVE`, `PAYMENT_VERIFICATION_FAILED`, `SUBMISSION_NOT_OPEN`, `SUBMISSION_CLOSED`, `SUBMISSION_EXISTS`, `CANCELLATION_WINDOW_CLOSED`, `CAPACITY_BELOW_BOOKED`, `RATE_LIMITED`.

Every mutation returns the refreshed view-model so the app re-renders in one round-trip.

---

## 3. Data model

```
Competition        User                Registration (1 per competition×user)   Submission (1 per competition×user)
─────────────      ─────────────       ─────────────────────────────────────   ──────────────────────────────────
slug, status       name, email         competitionId, userId (unique idx)      competitionId, userId (unique idx)
title {en,hi}      referralCode        status: pending|reserved|confirmed|     registrationId, title, mediaUrl,
category, tags     referralEarnings            expired|cancelled|failed        mediaType, submittedAt, revision
prizePoolPaise                         expiresAt, confirmedAt, cancelledAt
entryFeePaise                          payment { provider, orderId,
capacity {total, booked}                         paymentId, amountPaise, paidAt }
schedule { registrationOpensAt, registrationClosesAt,
           submissionStartsAt, submissionEndsAt, resultAt }
judge, previousWinners[], about, judgingParameters[], rules[], rewards[], media, referral
```

- **Lifecycle is derived, not stored.** `phase`, windows, countdown target and the primary action are computed from `schedule` + server time on every read (`services/lifecycle.js`, pure and unit-tested). Nothing can go stale and no cron is needed to "flip" states.
- **Money is integer paise**; formatting happens on the client.
- **Localised fields** are `{ en, hi }` sub-documents resolved server-side; the app only owns UI chrome strings.
- **`capacity.booked`** is a denormalised counter (confirmed + live reservations). It is the only field touched under contention and is changed exclusively via guarded atomic `$inc`.

---

## 4. Business rules & states

Registration state machine:

```
(none) → pending → reserved → confirmed → cancelled
              ↘ failed     ↘ expired (TTL, spot released by sweeper)
```

| Situation                                | Behaviour                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Registration window                      | `registrationOpensAt ≤ now < registrationClosesAt`, competition `published`  |
| Paid competition                         | Spot is **reserved** for `RESERVATION_TTL_SECONDS`; confirmed on payment      |
| Free competition                         | Confirmed immediately                                                        |
| Spots exhausted                          | `COMPETITION_FULL`; UI shows "Competition Full", bar turns red               |
| Duplicate registration                   | Same user can never hold two spots; a live reservation is returned as-is     |
| Cancel                                   | Allowed until registration closes and only before uploading a submission    |
| Submission                               | Only `confirmed` participants, inside `submissionStartsAt..submissionEndsAt`, one replaceable entry |
| Results                                  | After `resultAt` the primary action becomes "View Results"                   |
| Countdown                                | Targets the next meaningful boundary for the current phase; "Hurry up!" when < 48 h or ≤ 25 % spots left |
| Admin edits                              | Schedule validated (open < close ≤ submission end ≤ result); capacity cannot drop below booked; optimistic concurrency via version key |

The **server decides the primary action** (`viewer.primaryAction = { type, enabled, labelKey, subLabelKey }`). The app maps label keys to copy but never re-derives eligibility, so iOS/Android/web can never disagree and rules can change without an app release.

---

## 5. Concurrency & consistency

Thousands of users may hit "Register" on the last spot at the same time. The design avoids both overselling and lost updates **without requiring transactions** (which need a replica set):

1. **Per-user de-duplication first.** The registration row is upserted into `pending` under the unique `(competitionId, userId)` index. Of N concurrent requests from one user exactly one proceeds; the rest get `409` without ever touching the counter.
2. **Guarded atomic claim.** `findOneAndUpdate({ _id, status:'published', registration window contains now, $expr: booked < total }, { $inc: { booked: 1 } })`. The rule checks and the increment are one document operation, so two requests can never both take the last spot.
3. **Commit or compensate.** The row is moved to `reserved`/`confirmed`. If that fails the spot is released (`$inc: -1`, floored at zero) and the row is marked `failed`.
4. **Reservation TTL.** A background sweeper expires unpaid reservations and releases their spots; each transition is status-guarded so it is idempotent and safe to run from several instances. Payment confirmation is likewise guarded (`status: 'reserved'`), so a sweep and a confirm racing cannot double-count.
5. **Client freshness.** The app polls the view-model every 15 s, refetches on foreground/focus, re-fetches the instant a countdown boundary passes, and writes the view-model returned by every mutation straight into the cache. Any conflict error triggers a refetch so the UI can never stay on a stale "Register" button. Countdowns use a **server-clock offset** so a wrong device clock cannot show a wrong timer.

`backend/tests/registration.test.js` fires 200 simultaneous registrations at a 20-spot competition and asserts exactly 20 succeed with `booked === 20`, and that one user hammering 25 times holds exactly one spot and is never told "full".

### 5a. Payments (Razorpay)

```
App                         Backend                              Razorpay
 │ POST /registrations ───▶ │ hold spot, create Order ─────────▶ │
 │ ◀── { orderId, keyId } ──│ ◀──────────── order_xxx ───────────│
 │ open Standard Checkout in a WebView (checkout.js) ───────────▶ │  user pays
 │ ◀── payment_id + signature (postMessage) ──────────────────────│
 │ POST /registrations/confirm ▶ │ verify HMAC(order|payment) → confirmed
 │                          │ ◀── POST /webhooks/razorpay (payment.captured) ─│  second source of truth
```

- `backend/src/services/paymentService.js` is the only file that knows about Razorpay. With `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` set it creates real orders and verifies real signatures; without them it runs in **mock mode** and the app shows a demo "Pay" button. The response tells the client which mode is active (`payment.mode`), and the secret never leaves the server.
- The order is created **after** the spot is held, so a gateway outage releases the spot instead of selling one that cannot be paid for.
- Confirmation is idempotent and status-guarded, so the checkout callback and the webhook can both arrive (in any order, or twice) without double-counting. A payment that lands after the hold expired is logged with `needsRefund` instead of overselling.
- The webhook is mounted with a raw-body parser because Razorpay signs the exact bytes.
- The app uses **Standard Checkout inside a WebView** (`RazorpayCheckout.tsx`) so it runs in Expo Go; the native SDK needs a custom build. UPI/bank deep links are handed to the OS.

**Enable it:** Razorpay Dashboard → Settings → API Keys → *Generate Test Key*, put the id and secret in `backend/.env`, restart. Use the demo card below (any future expiry, any CVV, OTP `1234` if asked):

| Demo card             | Expiry       | CVV |
| --------------------- | ------------ | --- |
| `4100 2800 0000 1007` | any future   | any |

The app also prints this card inside the checkout sheet whenever a test key (`rzp_test_…`) is in use. For the webhook, expose the backend (e.g. `ngrok http 4000`), then Dashboard → Settings → Webhooks → URL `https://<host>/api/v1/webhooks/razorpay`, event `payment.captured`, and copy the secret into `RAZORPAY_WEBHOOK_SECRET`. The webhook is optional for local demos; the checkout callback alone confirms the spot.

---

## 6. Assumptions

- **Authentication** is a demo e-mail login issuing a JWT; the assignment is about the competition module, and the bearer-token plumbing is identical to what an OTP/OAuth flow would produce.
- **Payments** run through Razorpay when keys are configured (see section 5a) and through a built-in mock otherwise, so the project stays runnable without a gateway account. The mock accepts the literal signature `mock`; the real path verifies the HMAC and the webhook.
- **Submissions** are a media URL (no file upload pipeline); the model, window checks and replace-semantics are real.
- "Only 19 spots left" counts **confirmed + live reservations**, i.e. spots that are genuinely unavailable right now.
- Registration and submission windows may **overlap** (as in the design: submissions start 6 Aug, registration closes 10 Aug), so they are modelled independently rather than as one linear state.
- A reservation made while registration was open may still be paid after the window closes (the spot was already held); cancellation with refund is only allowed until registration closes.
- Times are stored in UTC and rendered in the device's locale/time-zone.
- The bottom navigation and "Ad Here" are visual placeholders; only the Competitions tab is wired.

## 7. Major technical decisions

- **Derived lifecycle instead of a stored status** – eliminates an entire class of stale-state bugs and scheduled jobs.
- **Server-driven primary action** – single source of truth for "what can this user do right now".
- **Atomic counter + unique index + compensation** over multi-document transactions – works on a standalone MongoDB and on Atlas, keeps the hot path to two writes, and is fully covered by a race test.
- **Reservation TTL** – prevents abandoned checkouts from blocking spots, and prevents overselling while a user is on the payment sheet.
- **View-model endpoint** – the screen needs one request; mutations return the same shape so the client has no merging logic.
- **TanStack Query** for caching/polling/focus refetch; **React Navigation** with deep links (`feedants://competitions/<slug>`); **Expo** for zero-native-setup runs.
- **Design system**: a soft, minimal token set in `mobile/src/theme` (brand teal kept, near-white surfaces, hairline borders instead of elevation, calm 500/600 type weights, uppercase eyebrow labels). Every component reads from the tokens, so the look is changed in one file. The Competition Details screen keeps the reference layout and content order.
- **UI/UX details**: the design typeface (Poppins) via a `Text` wrapper that maps `fontWeight` to font faces; a layout-matching skeleton while loading; non-blocking toasts with haptic feedback for success/error; a "could not refresh" banner that keeps the last good data visible when the network drops; a live "spot held mm:ss" chip while a paid reservation is pending; and a red "All spots booked" chip when full.
- **Zod validation at the edge**, consistent error envelope with machine codes, Helmet/CORS/rate-limiting keyed by user, structured Pino logs, graceful shutdown.
- **Localised content in the database** (`{en, hi}`) resolved per request, UI chrome localised in the app.

## 8. Trade-offs considered

- **Compensation vs. transactions.** A crash between "claim spot" and "commit row" could leak one spot until an operator reconciles it. Transactions (on a replica set) would remove that window at the cost of coordination overhead on the hottest path. The counter can be reconciled from registrations at any time, so the simpler design was chosen and the risk documented.
- **Polling vs. push.** Polling every 15 s plus refetch-on-action keeps the backend stateless and horizontally scalable. WebSockets/SSE would give sub-second "spots left" updates at the cost of connection management.
- **Booked counter vs. counting registrations.** The denormalised counter makes reads O(1) and the claim a single-document op; the cost is one more invariant to protect (done via guarded updates and a sweeper).
- **Demo auth / mock payment** keep the project runnable in minutes; both sit behind interfaces designed for real providers.
- **In-memory MongoDB fallback** trades persistence for zero setup in development; production refuses to start without `MONGODB_URI`.

## 9. What I would do next for production

- Finish the payment loop: automatic **refunds** via the Razorpay Refunds API on cancel and for the `needsRefund` case (money arrived after the hold expired), a payment-attempt audit collection, and a custom dev build with the native `react-native-razorpay` SDK for UPI intent flows that behave better outside a WebView.
- Replace demo auth with OTP/OAuth, refresh tokens, and per-device sessions.
- Move the sweeper to a dedicated worker (or a MongoDB TTL-triggered change stream) and add a reconciliation job that recomputes `capacity.booked` from registrations.
- Multi-document **transactions** on the register path once a replica set is guaranteed.
- Real media upload (pre-signed S3/GCS URLs, virus scan, transcoding) and a results/leaderboard model.
- Caching of the public part of the view-model (Redis/CDN with short TTL, per-language) – only the `viewer` slice is per-user.
- Observability: OpenTelemetry traces, metrics for claim failures and reservation expiries, alerting on counter drift.
- Contract tests generated from the Zod schemas (OpenAPI), component tests with React Native Testing Library, and a Detox flow for register → pay → submit.
- Accessibility pass (dynamic type, screen-reader labels are present but untested on device), offline handling, and analytics events for each state transition.
