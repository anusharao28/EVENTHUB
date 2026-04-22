# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
EventHub is a full-stack event ticket booking platform built for QA training. Users can browse events, book tickets, manage bookings, and create events. Each user operates in an isolated sandbox — events and bookings are private to their account.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React Query v5
- **Backend**: Express.js, Prisma ORM, MySQL 8+
- **Auth**: JWT (7-day expiry), bcryptjs
- **Testing**: Playwright E2E (Chromium only, sequential — `fullyParallel: false`)

## Commands

```bash
# Development
npm run setup        # Install deps in both /backend and /frontend
npm run dev          # Start frontend (port 3000) + backend (port 3001) concurrently
npm run seed         # Insert 10 static events into the database
npm run db:push      # Push Prisma schema to DB (non-interactive, no migration files)
npm run migrate      # prisma migrate dev (interactive, creates migration files)

# Testing
npm run test                                                         # Run all Playwright tests
npm run test:ui                                                      # Playwright with UI mode
npx playwright test tests/<file>.spec.js --reporter=line            # Run a single test file

# Frontend only
npm run lint --prefix frontend
```

**Environment setup** — create `backend/.env`:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/eventhub"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Architecture

Backend follows a strict layered pattern: **Routes → Controllers → Services → Repositories → Database**

- **Routes** (`src/routes/`): Express routers with Swagger JSDoc — no logic, just mount validators + controller methods
- **Controllers** (`src/controllers/`): Thin HTTP layer — extract request params, call service, send response
- **Services** (`src/services/`): All business logic and transactions live here
- **Repositories** (`src/repositories/`): Pure Prisma data access, no business logic
- **Validators** (`src/validators/`): express-validator middleware chains, run before controllers
- **Utils** (`src/utils/errors.js`): Domain errors (`NotFoundError`, `InsufficientSeatsError`, `ValidationError`) mapped to HTTP by `errorHandler.js`

The three route groups are: **auth** (`/api/auth`), **events** (`/api/events`), **bookings** (`/api/bookings`).

Frontend uses React Query hooks (`lib/hooks/`) that call Axios API clients (`lib/api/`). State is never lifted to global store — each page fetches its own data.

Swagger UI is available at `http://localhost:3001/api/docs` when running locally.

## Database Models (Prisma)

```
User      id, email (unique), password, createdAt
Event     id, title, description, category, venue, city, eventDate, price,
          totalSeats, availableSeats, imageUrl, isStatic (seeded=true), userId (nullable)
Booking   id, eventId, userId, customerName, customerEmail, customerPhone,
          quantity, totalPrice, status, bookingRef (unique), createdAt
```

`isStatic=true` events are the 10 seeded events and are immutable. `userId=null` on an event means it is a static/shared event.

## API Endpoints

**Auth** (no auth required except `/me`):
- `POST /api/auth/register` — create account, returns JWT
- `POST /api/auth/login` — returns JWT
- `GET /api/auth/me` — validate token, returns user identity

**Events** (auth required for write operations):
- `GET /api/events` — list with filters: `category`, `city`, `search`, `page`, `limit`
- `GET /api/events/:id`
- `POST /api/events` — create event
- `PUT /api/events/:id` — update event
- `DELETE /api/events/:id` — delete event (cascades bookings)

**Bookings** (auth required):
- `GET /api/bookings` — list user's bookings (filterable by `status`)
- `GET /api/bookings/:id`
- `GET /api/bookings/ref/:ref` — lookup by reference code (e.g. `EVT-A3B2C1`)
- `POST /api/bookings` — create booking (atomically decrements `availableSeats`)
- `DELETE /api/bookings/:id` — cancel booking (restores seats)

## Key Business Rules
- Max 6 user-created events per user — FIFO pruning on overflow
- Max 9 bookings per user — FIFO pruning on overflow
- `bookingRef` first character = event title first character (uppercase), format `EVT-XXXXXX`
- `availableSeats` decrements on booking, restores on cancellation (atomic transactions)
- Refund eligibility: 1 ticket = eligible, >1 tickets = not eligible (client-side only)
- Cross-user booking access returns "Access Denied"
- Static events (seeded, `isStatic=true`) cannot be edited or deleted

## Testing

**Tests target the hosted production instance**, not localhost. The `baseURL` in `playwright.config.ts` is `https://eventhub.rahulshettyacademy.com`. Tests run sequentially (`fullyParallel: false`).

**Production API base URL** (used by API-level tests with Playwright's `request` fixture):
```
https://api.eventhub.rahulshettyacademy.com/api
```
This differs from the frontend domain. E2E tests use `BASE_URL = 'https://eventhub.rahulshettyacademy.com'`; API tests use `API_BASE = 'https://api.eventhub.rahulshettyacademy.com/api'`.

Test account: `rahulshetty1@gmail.com` / `Magiclife1!`

Test files go in `tests/` as `<feature-name>.spec.js`. Each test must be self-contained: login → action → assert. No `page.waitForTimeout()` — use `expect().toBeVisible()`.

**Locator priority**: `data-testid` > role > label/placeholder > ID > CSS class

Key `data-testid` selectors:

| Selector | Element |
|---|---|
| `event-card` | Event card in listings |
| `book-now-btn` | "Book Now" link on event card |
| `quantity-input` | Ticket quantity in booking form |
| `customer-name`, `customer-email`, `customer-phone` | Booking form fields |
| `confirm-booking-btn` | Submit booking |
| `booking-ref` | Reference shown after booking |
| `booking-card` | Booking card in My Bookings |
| `cancel-booking-btn` | Cancel booking |
| `confirm-dialog-yes` | Confirm button in any dialog |
| `admin-event-form`, `event-title-input`, `add-event-btn` | Admin create/edit form |
| `event-table-row`, `edit-event-btn`, `delete-event-btn` | Admin events table |
| `nav-events`, `nav-bookings` | Navbar links |

## Custom Slash Commands (Agents)
- `/generate-tests <feature>` — AI Test Automation Engineer: generates Playwright tests
- `/review-tests <file>` — AI Code Reviewer: reviews test code quality
- `/create-scenarios <area>` — AI Functional Tester: creates test scenario documents
- `/test-strategy <scenarios>` — AI Test Architect: assigns tests to optimal pyramid layers

## Skill Documents (`.claude/skills/`)
- `playwright-best-practices/` — Playwright testing standards
- `eventhub-domain/` — Domain knowledge, business rules, UI selectors, user flows, API reference
