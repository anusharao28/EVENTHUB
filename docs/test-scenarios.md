# EventHub — Test Scenarios

Generated: 2026-03-06 | Updated: 2026-04-22
Scope: Registration & Login (Flow 1) · Booking Management (Flow 4 — View, Cancel, Clear, Refund Eligibility)

---

## Happy Path

### TC-001: View bookings list with existing bookings
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; user has at least one confirmed booking
**Steps**:
1. Navigate to `/bookings`
2. Observe the list of booking cards rendered
**Expected Results**: Each booking card displays booking reference, event name, quantity, total price, and "View Details" link
**Business Rule**: Flow 4 — Manage Bookings
**Suggested Layer**: E2E

---

### TC-002: View single booking detail page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; user has at least one confirmed booking
**Steps**:
1. Navigate to `/bookings`
2. Click "View Details" on any booking card
3. Observe the booking detail page at `/bookings/:id`
**Expected Results**: Page shows event details (title, date, venue, city, category), customer details (name, email, phone), payment summary (quantity, price per ticket, total paid), booking reference in breadcrumb and header, booking ID, and "Check eligibility for refund?" link
**Business Rule**: Booking model fields; Flow 4
**Suggested Layer**: E2E

---

### TC-003: Cancel a single booking from the detail page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; user has at least one confirmed booking
**Steps**:
1. Navigate to `/bookings/:id`
2. Click "Cancel Booking" button
3. Confirm in the dialog by clicking "Yes, cancel it"
4. Observe redirect and bookings list
**Expected Results**: Success toast "Booking cancelled successfully" appears; user is redirected to `/bookings`; cancelled booking no longer appears in the list
**Business Rule**: Booking cancellation deletes the record; seats released for dynamic events
**Suggested Layer**: E2E

---

### TC-004: Clear all bookings from the bookings list page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; user has at least one booking
**Steps**:
1. Navigate to `/bookings`
2. Click "Clear all bookings" link
3. Confirm the browser confirm dialog
4. Observe the page after clearing
**Expected Results**: All bookings are removed; page shows empty state "No bookings yet" with "Browse Events" button
**Business Rule**: `DELETE /api/bookings` clears all user bookings; `clearAllBookings` service method
**Suggested Layer**: E2E

---

### TC-005: Navigate back to bookings list from detail page
**Category**: Happy Path
**Priority**: P2
**Preconditions**: User is on a booking detail page
**Steps**:
1. Click "← Back to My Bookings" button at bottom of detail page
**Expected Results**: User is navigated to `/bookings`
**Business Rule**: UI navigation flow
**Suggested Layer**: E2E

---

### TC-006: Navigate to bookings via "View My Bookings" after completing a booking
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User just completed a booking (confirmation card shown)
**Steps**:
1. After booking confirmation, click "View My Bookings" link
2. Observe the bookings page
**Expected Results**: User lands on `/bookings` and the newly created booking appears in the list
**Business Rule**: Flow 3 → Flow 4 navigation
**Suggested Layer**: E2E

---

### TC-007: Lookup booking by reference via API
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User is authenticated; user has a booking with known `bookingRef`
**Steps**:
1. Send `GET /api/bookings/ref/:ref` with valid JWT and own booking ref
**Expected Results**: 200 response with full booking data including nested event
**Business Rule**: `GET /api/bookings/ref/:ref` endpoint
**Suggested Layer**: API

---

### TC-010: Successful registration with new email and strong password
**Category**: Happy Path
**Priority**: P0
**Preconditions**: Email is not already registered
**Steps**:
1. Navigate to `/register`
2. Fill `[data-testid="register-email"]` with a unique email (e.g., `testuser+<timestamp>@example.com`)
3. Fill `[data-testid="register-password"]` with a strong password (e.g., `Test@1234`)
4. Fill the confirm password field with the same password
5. Click `[data-testid="register-btn"]`
**Expected Results**: Account is created; user is redirected to home (`/`); JWT token is stored in `localStorage`; navbar reflects authenticated state
**Business Rule**: Flow 1 — registration issues JWT and redirects to home
**Suggested Layer**: E2E

---

### TC-011: Successful login with existing credentials
**Category**: Happy Path
**Priority**: P0
**Preconditions**: A registered account exists (e.g., `rahulshetty1@yahoo.com` / `Magiclife1!`)
**Steps**:
1. Navigate to `/login`
2. Fill `#email` with the registered email
3. Fill `#password` with the correct password
4. Click `#login-btn`
**Expected Results**: User is redirected to home (`/`); JWT stored in `localStorage`; navbar reflects authenticated state
**Business Rule**: Flow 1 — login issues JWT and redirects to home
**Suggested Layer**: E2E

---

### TC-012: Navigate from login page to registration page
**Category**: Happy Path
**Priority**: P2
**Preconditions**: User is on `/login`
**Steps**:
1. Click the "Register" link in the form footer
**Expected Results**: User is navigated to `/register`; registration form is displayed
**Business Rule**: Flow 1 — navigation between auth pages
**Suggested Layer**: E2E

---

### TC-013: Navigate from registration page to login page
**Category**: Happy Path
**Priority**: P2
**Preconditions**: User is on `/register`
**Steps**:
1. Click the "Sign in" link in the form footer
**Expected Results**: User is navigated to `/login`; login form is displayed
**Business Rule**: Flow 1 — navigation between auth pages
**Suggested Layer**: E2E

---

### TC-014: GET /api/auth/me returns authenticated user identity
**Category**: Happy Path
**Priority**: P1
**Preconditions**: A valid JWT token has been obtained via login or registration
**Steps**:
1. Send `GET /api/auth/me` with `Authorization: Bearer <token>`
**Expected Results**: HTTP 200; response body contains `{ success: true, user: { userId, email } }`
**Business Rule**: `GET /api/auth/me` — decodes token and returns identity; confirms token is valid
**Suggested Layer**: API

---

## Business Rules

### TC-100: FIFO pruning — 10th booking replaces oldest booking from a different event
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has exactly 9 bookings (all for different events); user has JWT token
**Steps**:
1. Note the oldest booking ID
2. Create a new booking (10th) for a different event via `POST /api/bookings`
3. Retrieve all user bookings
**Expected Results**: Total booking count remains 9; the oldest booking is deleted; the new booking is present
**Business Rule**: Max 9 bookings per user; FIFO pruning prefers deleting from a different event
**Suggested Layer**: API

---

### TC-101: FIFO pruning — same-event fallback permanently burns a seat
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has exactly 9 bookings all for the SAME event; enough seats remain
**Steps**:
1. Create a 10th booking for the same event
2. Retrieve the event's available seats
**Expected Results**: Oldest booking is deleted; new booking is created; `availableSeats` decremented by the new booking's quantity (seat permanently burned via `decrementSeats`)
**Business Rule**: `sameEventFallback` path in `bookingService.createBooking`
**Suggested Layer**: API

---

### TC-102: Booking reference first character matches event title first character
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User is logged in; event with known title exists (e.g., "Tech Conference Bangalore")
**Steps**:
1. Book the event
2. Read the `bookingRef` from the confirmation card or API response
**Expected Results**: `bookingRef` starts with the uppercase first character of the event title (e.g., "T-XXXXXX" for "Tech Conference")
**Business Rule**: `randomRef` function: prefix = `eventTitle[0].toUpperCase()`; Rule 7
**Suggested Layer**: E2E / API

---

### TC-103: Refund eligibility — single ticket booking is eligible
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has a booking with quantity = 1
**Steps**:
1. Navigate to `/bookings/:id` for the single-ticket booking
2. Click "Check eligibility for refund?"
3. Wait for spinner to disappear (4 seconds)
4. Read the refund result
**Expected Results**: `#refund-result` shows green "Eligible for refund. Single-ticket bookings qualify for a full refund."
**Business Rule**: Rule 8 — quantity === 1 → eligible
**Suggested Layer**: E2E

---

### TC-104: Refund eligibility — multi-ticket booking is NOT eligible
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has a booking with quantity > 1 (e.g., 3 tickets)
**Steps**:
1. Navigate to `/bookings/:id` for the multi-ticket booking
2. Click "Check eligibility for refund?"
3. Wait for spinner to disappear (4 seconds)
4. Read the refund result
**Expected Results**: `#refund-result` shows red "Not eligible for refund. Group bookings (3 tickets) are non-refundable." with correct quantity displayed
**Business Rule**: Rule 8 — quantity > 1 → not eligible
**Suggested Layer**: E2E

---

### TC-105: Refund eligibility spinner shows for approximately 4 seconds
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User is on a booking detail page
**Steps**:
1. Click "Check eligibility for refund?"
2. Immediately check for spinner
3. Observe when spinner disappears and result appears
**Expected Results**: `#refund-spinner` is visible immediately after clicking; spinner disappears and `#refund-result` appears after ~4 seconds
**Business Rule**: Rule 8 — `setTimeout(..., 4000)` in `RefundEligibility` component
**Suggested Layer**: E2E / Component

---

### TC-106: Total price is calculated as price × quantity
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User books an event with known price
**Steps**:
1. Book an event (e.g., price $1499, quantity 3)
2. View the booking detail page
**Expected Results**: "Total Paid" shows $4,497 (1499 × 3); `totalPrice` in API response equals `event.price × quantity`
**Business Rule**: Rule 9 — `totalPrice = event.price × quantity`
**Suggested Layer**: E2E / API

---

### TC-107: Bookings page shows max 10 bookings per page (pagination)
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has more than 10 bookings visible in DB (unlikely with limit 9, but relevant for API pagination param)
**Steps**:
1. Send `GET /api/bookings?page=1&limit=10`
**Expected Results**: Response includes `pagination.limit = 10`, `pagination.totalPages`, and `data` array with at most 10 items
**Business Rule**: Rule 4 — max 9 bookings per user; API default limit = 10
**Suggested Layer**: API

---

### TC-108: Cancelling a booking releases seat count for dynamic events (computed)
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has a dynamic (user-created) event with a booking
**Steps**:
1. Note the current available seats for the event (computed: totalSeats - booked quantities)
2. Cancel the booking for that event
3. Re-fetch the event detail
**Expected Results**: Available seats increase by the cancelled booking's quantity
**Business Rule**: Rule 6 — dynamic events compute seats as `totalSeats - sum(user's booking quantities)`; cancellation removes the booking record
**Suggested Layer**: API / E2E

---

### TC-109: Bookings list shows "Clear all bookings" button whenever bookings exist
**Category**: Business Rule
**Priority**: P2
**Preconditions**: User has at least one booking
**Steps**:
1. Navigate to `/bookings`
2. Look for "Clear all bookings" link
**Expected Results**: "Clear all bookings" link is visible in the top-right of the page header
**Business Rule**: Flow 4 — UI always shows clear option when bookings exist
**Suggested Layer**: E2E / Component

---

### TC-110: Frontend password strength requirements are enforced before submit
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User is on `/register`
**Steps**:
1. Fill email with a valid address
2. Fill password with `password` (8 chars, lowercase only — no uppercase, no number, no special char)
3. Fill confirm password to match
4. Click "Create Account"
**Expected Results**: Form does not submit; inline error "Password does not meet the requirements below" appears; none of the four strength rules are satisfied (all shown in gray)
**Business Rule**: Frontend `isStrongPassword` requires: min 8 chars AND uppercase AND digit AND special char
**Suggested Layer**: E2E

---

### TC-111: Registration is rejected when email is already registered
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Account with `rahulshetty1@yahoo.com` already exists
**Steps**:
1. Navigate to `/register`
2. Fill email with `rahulshetty1@yahoo.com` and a valid strong password
3. Submit the form
**Expected Results**: Error toast "Email already registered" is displayed; no redirect occurs; user remains on `/register`
**Business Rule**: `authService.register` — throws `ValidationError('Email already registered')` if email exists
**Suggested Layer**: E2E / API

---

### TC-112: Login error message is identical for wrong password and non-existent email
**Category**: Business Rule
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Submit `POST /api/auth/login` with a non-existent email
2. Submit `POST /api/auth/login` with an existing email but wrong password
3. Compare the error messages in both responses
**Expected Results**: Both return HTTP 400; both return the identical message "Invalid email or password" — no distinction made between the two failure modes
**Business Rule**: `authService.login` — intentionally identical error to prevent email enumeration
**Suggested Layer**: API

---

### TC-113: Registration response returns JWT token and user identity (no password)
**Category**: Business Rule
**Priority**: P1
**Preconditions**: Email is not already registered
**Steps**:
1. Send `POST /api/auth/register` with valid email and password (min 6 chars)
**Expected Results**: HTTP 201; response body is `{ success: true, token: "<jwt>", user: { id, email } }`; `password` field is NOT present in the response
**Business Rule**: `authService.register` — returns token and sanitized user object; password hash is never exposed
**Suggested Layer**: API

---

### TC-114: Frontend password minimum (8 chars) is stricter than backend minimum (6 chars)
**Category**: Business Rule
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Send `POST /api/auth/register` directly with password `Ab1!23` (6 chars — meets backend but not frontend strength rules)
**Expected Results**: HTTP 201 — backend accepts the 6-char password and creates the account; this would be blocked on the UI but passes via API
**Business Rule**: Frontend `isStrongPassword` requires 8+ chars; backend `validateAuth` requires only 6+ chars — gap allows API-level bypass of UI constraints
**Suggested Layer**: API

---

### TC-115: Live password strength checklist updates as user types
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User is on `/register`
**Steps**:
1. Focus the `[data-testid="register-password"]` field
2. Type `a` (1 char, lowercase)
3. Type `A` (now `aA` — adds uppercase)
4. Type `1` (now `aA1` — adds digit)
5. Type `!` (now `aA1!` — adds special char)
6. Type `bcde` (now `aA1!bcde` — reaches 8 chars)
**Expected Results**: Each requirement's checklist item turns green (checkmark icon) as its condition is met; all four items are green after step 6
**Business Rule**: Frontend `PASSWORD_RULES` array evaluated live against `password` state on every keystroke
**Suggested Layer**: E2E / Component

---

### TC-116: JWT token payload contains userId and email claims
**Category**: Business Rule
**Priority**: P2
**Preconditions**: A valid JWT has been issued via login
**Steps**:
1. Decode the JWT (split on `.`, base64-decode middle segment)
2. Inspect the payload
**Expected Results**: Payload contains `{ userId: <int>, email: "<email>", iat, exp }`; `exp - iat` equals 604800 seconds (7 days)
**Business Rule**: `signToken` — `jwt.sign({ userId, email }, SECRET, { expiresIn: '7d' })`
**Suggested Layer**: API / Unit

---

## Security

### TC-200: Cross-user booking access returns "Access Denied" (UI)
**Category**: Security
**Priority**: P0
**Preconditions**: Two test accounts exist (rahulshetty1@gmail.com and rahulshetty1@yahoo.com); User A has a booking
**Steps**:
1. Log in as User A, create a booking, note the booking ID
2. Log out (clear localStorage JWT)
3. Log in as User B
4. Navigate to `/bookings/:userA_booking_id`
**Expected Results**: Page shows "Access Denied" title and "You are not authorized to view this booking." description
**Business Rule**: Rule 2 — cross-user access returns 403; frontend renders "Access Denied" on 403 response
**Suggested Layer**: E2E

---

### TC-201: Cross-user booking access returns 403 via API
**Category**: Security
**Priority**: P0
**Preconditions**: User A has a booking; User B has a valid JWT
**Steps**:
1. Send `GET /api/bookings/:userA_booking_id` with User B's JWT
**Expected Results**: HTTP 403; response body contains "You are not authorized to view this booking"
**Business Rule**: `bookingService.getBookingById` — `booking.userId !== userId` → ForbiddenError
**Suggested Layer**: API

---

### TC-202: Cross-user booking cancellation returns 403 via API
**Category**: Security
**Priority**: P0
**Preconditions**: User A has a booking; User B has a valid JWT
**Steps**:
1. Send `DELETE /api/bookings/:userA_booking_id` with User B's JWT
**Expected Results**: HTTP 403; booking is NOT deleted from the database
**Business Rule**: `bookingService.cancelBooking` — `booking.userId !== userId` → ForbiddenError
**Suggested Layer**: API

---

### TC-203: Unauthenticated access to bookings list returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: No valid JWT
**Steps**:
1. Send `GET /api/bookings` without Authorization header
**Expected Results**: HTTP 401; "Unauthorized" error message
**Business Rule**: Auth middleware on all `/api/bookings` routes
**Suggested Layer**: API

---

### TC-204: Unauthenticated access to booking detail returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: No valid JWT
**Steps**:
1. Send `GET /api/bookings/:id` without Authorization header
**Expected Results**: HTTP 401; "Unauthorized" error message
**Business Rule**: Auth middleware
**Suggested Layer**: API

---

### TC-205: Unauthenticated DELETE /api/bookings returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: No valid JWT
**Steps**:
1. Send `DELETE /api/bookings` without Authorization header
**Expected Results**: HTTP 401
**Business Rule**: Auth middleware; `clearAllBookings` requires authenticated user
**Suggested Layer**: API

---

### TC-206: Cross-user booking lookup by ref returns 403
**Category**: Security
**Priority**: P1
**Preconditions**: User A has a booking with known ref; User B has a valid JWT
**Steps**:
1. Send `GET /api/bookings/ref/:userA_ref` with User B's JWT
**Expected Results**: HTTP 403; "You do not own this booking"
**Business Rule**: `bookingService.getBookingByRef` — ownership check
**Suggested Layer**: API

---

### TC-210: GET /api/auth/me with no token returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: No Authorization header
**Steps**:
1. Send `GET /api/auth/me` with no Authorization header
**Expected Results**: HTTP 401; response body contains `{ success: false, error: "Unauthorized" }`
**Business Rule**: `authMiddleware` rejects requests without a valid Bearer token
**Suggested Layer**: API

---

### TC-211: GET /api/auth/me with malformed JWT returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: None
**Steps**:
1. Send `GET /api/auth/me` with `Authorization: Bearer not_a_real_token`
**Expected Results**: HTTP 401; "Unauthorized" error
**Business Rule**: `authMiddleware` — `jwt.verify` throws on malformed token
**Suggested Layer**: API

---

### TC-212: Demo email login failure shows amber warning instead of error toast
**Category**: Security
**Priority**: P1
**Preconditions**: Demo account `rahulshetty1@gmail.com` does not exist or has a different password in the test environment
**Steps**:
1. Navigate to `/login`
2. Enter `rahulshetty1@gmail.com` and any wrong password
3. Click "Sign In"
**Expected Results**: Amber warning banner appears ("Looks like you're using sample test credentials!") with a link to `/register`; no error toast is shown
**Business Rule**: Frontend `DEMO_EMAILS` list — special UX nudge instead of generic error for demo credentials
**Suggested Layer**: E2E

---

### TC-213: Registration response never exposes the password hash
**Category**: Security
**Priority**: P0
**Preconditions**: None
**Steps**:
1. Send `POST /api/auth/register` with a new valid email and password
2. Inspect the full response body
**Expected Results**: `password` field is absent from the response; only `{ token, user: { id, email } }` returned
**Business Rule**: `authService.register` — response constructed explicitly with `{ id, email }` only
**Suggested Layer**: API

---

### TC-214: Login with a tampered token is rejected by protected routes
**Category**: Security
**Priority**: P1
**Preconditions**: A valid JWT has been obtained
**Steps**:
1. Modify the payload segment of the JWT (e.g., change `userId` to another user's ID) and re-encode without re-signing
2. Send `GET /api/auth/me` with the tampered token
**Expected Results**: HTTP 401; "Unauthorized" — signature verification fails because the secret is not known
**Business Rule**: `authMiddleware` — `jwt.verify` with `JWT_SECRET` will reject any token whose signature doesn't match
**Suggested Layer**: API

---

## Negative / Error

### TC-300: Navigate to non-existent booking ID shows "Booking not found"
**Category**: Negative
**Priority**: P1
**Preconditions**: User is logged in
**Steps**:
1. Navigate to `/bookings/99999` (ID that does not exist)
**Expected Results**: Page shows "Booking not found" and "This booking doesn't exist or may have been cancelled." with "View My Bookings" button
**Business Rule**: `bookingService.getBookingById` throws NotFoundError → API returns 404; frontend renders not-found empty state
**Suggested Layer**: E2E

---

### TC-301: GET /api/bookings/:id with non-existent ID returns 404
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated
**Steps**:
1. Send `GET /api/bookings/99999` with valid JWT
**Expected Results**: HTTP 404; error message "Booking with id 99999 not found"
**Business Rule**: `bookingService.getBookingById` — NotFoundError
**Suggested Layer**: API

---

### TC-302: Create booking with insufficient seats returns 400
**Category**: Negative
**Priority**: P0
**Preconditions**: User is authenticated; event has 0 personal available seats (all booked by this user)
**Steps**:
1. Send `POST /api/bookings` with `quantity: 1` for a fully-booked event
**Expected Results**: HTTP 400; "Only 0 seat(s) available, but 1 requested"
**Business Rule**: `bookingService.createBooking` — `InsufficientSeatsError` when `personalAvailable < quantity`
**Suggested Layer**: API

---

### TC-303: Create booking for non-existent event returns 404
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated
**Steps**:
1. Send `POST /api/bookings` with `eventId: 99999`
**Expected Results**: HTTP 404; "Event with id 99999 not found"
**Business Rule**: `bookingService.createBooking` — event lookup fails → NotFoundError
**Suggested Layer**: API

---

### TC-304: Create booking with missing required fields returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated
**Steps**:
1. Send `POST /api/bookings` with missing `customerName`, `customerEmail`, or `customerPhone`
**Expected Results**: HTTP 400; validation error message listing missing fields
**Business Rule**: Input validators on the bookings route
**Suggested Layer**: API

---

### TC-305: Create booking with quantity = 0 or negative returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated
**Steps**:
1. Send `POST /api/bookings` with `quantity: 0`
2. Send `POST /api/bookings` with `quantity: -1`
**Expected Results**: HTTP 400; validation error for both cases
**Business Rule**: quantity must be 1–10 per booking model
**Suggested Layer**: API

---

### TC-306: Create booking with quantity > 10 returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated
**Steps**:
1. Send `POST /api/bookings` with `quantity: 11`
**Expected Results**: HTTP 400; validation error
**Business Rule**: quantity must be 1–10
**Suggested Layer**: API

---

### TC-307: Cancel a booking that has already been cancelled returns 404
**Category**: Negative
**Priority**: P1
**Preconditions**: User is authenticated; a booking exists
**Steps**:
1. Delete the booking via `DELETE /api/bookings/:id`
2. Attempt to delete the same booking again
**Expected Results**: HTTP 404; "Booking with id X not found"
**Business Rule**: `cancelBooking` uses `bookingRepository.findById` — not found after deletion
**Suggested Layer**: API

---

### TC-308: Bookings page shows error state when server is unreachable
**Category**: Negative
**Priority**: P2
**Preconditions**: Backend server is down or returns 500
**Steps**:
1. Navigate to `/bookings` with backend unavailable
**Expected Results**: Error empty state renders: "Couldn't load bookings", "Failed to connect to the server. Please try again.", and a "Retry" button
**Business Rule**: `isError` branch in `BookingsContent` component
**Suggested Layer**: Component / E2E

---

### TC-310: Registration with invalid email format shows inline error
**Category**: Negative
**Priority**: P0
**Preconditions**: User is on `/register`
**Steps**:
1. Fill `[data-testid="register-email"]` with `notanemail` (no `@`)
2. Fill password and confirm password with a valid strong password
3. Click "Create Account"
**Expected Results**: Form does not submit; inline error "Enter a valid email" appears below the email field; no API call made
**Business Rule**: Frontend `validate()` — email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
**Suggested Layer**: E2E

---

### TC-311: Registration with password shorter than 8 characters shows strength error
**Category**: Negative
**Priority**: P0
**Preconditions**: User is on `/register`
**Steps**:
1. Fill a valid email
2. Fill password with `Ab1!xy` (6 chars — meets backend, fails frontend)
3. Click "Create Account"
**Expected Results**: Error "Password does not meet the requirements below" shown; "At least 8 characters" rule remains gray/unsatisfied; form not submitted
**Business Rule**: Frontend strength rule: `p.length >= 8`
**Suggested Layer**: E2E

---

### TC-312: Registration with mismatched confirm password shows error
**Category**: Negative
**Priority**: P0
**Preconditions**: User is on `/register`
**Steps**:
1. Fill a valid email and a strong password (e.g., `Test@1234`)
2. Fill confirm password with a different value (e.g., `Test@5678`)
3. Click "Create Account"
**Expected Results**: Error "Passwords do not match" appears below the confirm password field; form not submitted
**Business Rule**: Frontend `validate()` — `password !== confirm`
**Suggested Layer**: E2E

---

### TC-313: Login with empty fields shows inline field-level errors
**Category**: Negative
**Priority**: P0
**Preconditions**: User is on `/login`
**Steps**:
1. Leave email and password empty
2. Click "Sign In"
**Expected Results**: Two inline errors appear — "Enter a valid email" below email field, "Password must be at least 6 characters" below password field; no API call made
**Business Rule**: Frontend `validate()` in login page — both fields validated on submit
**Suggested Layer**: E2E

---

### TC-314: Login with incorrect password shows error toast
**Category**: Negative
**Priority**: P0
**Preconditions**: Account `rahulshetty1@yahoo.com` exists
**Steps**:
1. Navigate to `/login`
2. Enter `rahulshetty1@yahoo.com` and password `WrongPassword1!`
3. Click "Sign In"
**Expected Results**: Error toast appears with "Invalid email or password" (or similar server error message); user remains on `/login`
**Business Rule**: `authService.login` — `bcrypt.compare` returns false → `ValidationError('Invalid email or password')`
**Suggested Layer**: E2E

---

### TC-315: Login with non-existent email shows error toast
**Category**: Negative
**Priority**: P0
**Preconditions**: Email `ghost@noemail.com` is not registered
**Steps**:
1. Navigate to `/login`
2. Enter `ghost@noemail.com` and any password (6+ chars)
3. Click "Sign In"
**Expected Results**: Error toast with "Invalid email or password"; same message as wrong password — no distinction
**Business Rule**: `authService.login` — user not found → same error as wrong password (no email enumeration)
**Suggested Layer**: E2E

---

### TC-316: POST /api/auth/register with missing email field returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Send `POST /api/auth/register` with body `{ "password": "secret123" }` (email omitted)
**Expected Results**: HTTP 400; validation error listing `email` field as required
**Business Rule**: `validateAuth` middleware in `authRoutes.js` — email and password are both required
**Suggested Layer**: API

---

### TC-317: POST /api/auth/login with password shorter than 6 chars returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Send `POST /api/auth/login` with `{ "email": "test@test.com", "password": "abc" }` (3 chars)
**Expected Results**: HTTP 400; validation error: "Password must be at least 6 characters"
**Business Rule**: `validateAuth` — backend minimum is 6 chars (weaker than frontend's 8+)
**Suggested Layer**: API

---

## Edge Cases

### TC-400: Exactly 9 bookings — adding a 10th prunes oldest from a DIFFERENT event (preferred)
**Category**: Edge Case
**Priority**: P0
**Preconditions**: User has exactly 9 bookings across multiple events
**Steps**:
1. Note the ID of the oldest booking (different event from the new booking's event)
2. Create a new (10th) booking for Event X
3. Check the bookings list
**Expected Results**: Count stays at 9; oldest booking (different event) is gone; new booking is present
**Business Rule**: `findOldestUserBookingExcludingEvent` preferential pruning in `bookingService.createBooking`
**Suggested Layer**: API

---

### TC-401: Exactly 9 bookings all from same event — 10th triggers same-event fallback and burns seat
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User has 9 bookings all for Event X
**Steps**:
1. Create a new booking for Event X (10th)
2. Re-fetch Event X's available seats
**Expected Results**: Oldest booking removed; new booking created; `availableSeats` is permanently decremented by the new quantity (seat burned via `eventRepository.decrementSeats`)
**Business Rule**: `sameEventFallback = true` → `decrementSeats` called in `bookingService.createBooking`
**Suggested Layer**: API

---

### TC-402: Booking with quantity = 1 (minimum) — full happy path
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User is logged in; event has available seats
**Steps**:
1. Navigate to event detail page
2. Leave quantity at 1 (default minimum)
3. Fill customer form and confirm booking
**Expected Results**: Booking created with `quantity: 1`; `totalPrice = price × 1`; booking ref generated
**Business Rule**: quantity boundary: 1 is minimum
**Suggested Layer**: E2E

---

### TC-403: Booking with quantity = 10 (maximum)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User is logged in; event has >= 10 available seats
**Steps**:
1. Navigate to event detail; click "+" 9 times to reach quantity 10
2. Fill form and confirm booking
**Expected Results**: Booking created with `quantity: 10`; `totalPrice = price × 10`; increment button disabled at 10
**Business Rule**: quantity boundary: 10 is maximum; UI should prevent going above 10
**Suggested Layer**: E2E

---

### TC-404: Refund eligibility boundary — quantity = 2 is NOT eligible (just above threshold)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User has a booking with quantity = 2
**Steps**:
1. Navigate to booking detail
2. Click "Check eligibility for refund?"
3. Wait 4 seconds
**Expected Results**: Result shows "Not eligible for refund. Group bookings (2 tickets) are non-refundable."
**Business Rule**: Rule 8 — threshold is quantity === 1; quantity = 2 is the first ineligible value
**Suggested Layer**: E2E

---

### TC-405: Booking reference uniqueness — collision retry mechanism
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Many bookings exist with the same event title prefix (stress scenario)
**Steps**:
1. Create many bookings for events starting with the same letter
2. Verify each `bookingRef` is unique in DB
**Expected Results**: All booking references are unique; no duplicates; fallback timestamp-based ref used after 10 failed attempts
**Business Rule**: `generateUniqueRef` — up to 10 retries, then timestamp fallback
**Suggested Layer**: Unit

---

### TC-406: Clear all bookings when only one booking exists
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User has exactly 1 booking
**Steps**:
1. Navigate to `/bookings`
2. Click "Clear all bookings" and confirm
**Expected Results**: Booking is deleted; page shows empty state; `DELETE /api/bookings` returns `{ deleted: 1 }`
**Business Rule**: `clearAllBookings` — `deleteAllForUser` returns count of deleted records
**Suggested Layer**: E2E / API

---

### TC-407: Pagination on bookings list (API) — page 2 with partial results
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User has more than the default page limit of bookings visible in API
**Steps**:
1. Send `GET /api/bookings?page=2&limit=5`
**Expected Results**: Returns page 2 results; `pagination.page = 2`; `data` array contains at most 5 items
**Business Rule**: Pagination behavior in `bookingService.getBookings`
**Suggested Layer**: API

---

### TC-408: Event title starting with a number — booking ref prefix is uppercase of that character
**Category**: Edge Case
**Priority**: P2
**Preconditions**: An event exists whose title starts with a digit (e.g., "100 Days Festival")
**Steps**:
1. Book the event
2. Check the `bookingRef`
**Expected Results**: `bookingRef` starts with "1-XXXXXX" (digit is used as-is, `toUpperCase()` has no effect on digits)
**Business Rule**: `randomRef` — `prefix = (eventTitle?.[0] ?? 'E').toUpperCase()`
**Suggested Layer**: API / Unit

---

### TC-410: Password with exactly 6 chars passes backend but is blocked client-side
**Category**: Edge Case
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Via API: `POST /api/auth/register` with `{ "email": "edge6@test.com", "password": "Ab1!xy" }` (6 chars, has uppercase, digit, special)
2. Via UI: Attempt the same password in the register form
**Expected Results**: API → HTTP 201 (account created); UI → form blocked with strength error ("At least 8 characters" rule fails)
**Business Rule**: Frontend requires 8+ chars; backend requires only 6+ — this gap is an intentional discrepancy to test
**Suggested Layer**: API + E2E

---

### TC-411: Password with exactly 8 chars meeting all requirements succeeds
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Email not already registered
**Steps**:
1. Navigate to `/register`
2. Enter password `Test@123` (8 chars: uppercase T, digit 1,2,3, special @)
3. Confirm and submit
**Expected Results**: All four strength rules turn green; form submits successfully; account is created
**Business Rule**: Frontend `isStrongPassword` — 8 is the minimum that satisfies `p.length >= 8`
**Suggested Layer**: E2E

---

### TC-412: Login with password at exactly the 6-char minimum passes client-side
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Account exists with a 6-char password (created via API bypass)
**Steps**:
1. Navigate to `/login`
2. Enter 6-character password
3. Submit
**Expected Results**: Client-side validation passes (rule is only `>= 6 chars`); request sent to backend; login succeeds if password matches
**Business Rule**: Login page `validate()` — only checks `password.length < 6`, no strength rules
**Suggested Layer**: E2E

---

### TC-413: Duplicate registration of same email within same session — second attempt is blocked
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User registers with `newuser@test.com` successfully
**Steps**:
1. Register with `newuser@test.com` — succeeds, redirected to home
2. Log out (clear localStorage)
3. Navigate to `/register` and submit with the same email again
**Expected Results**: Error toast "Email already registered" on second attempt; no new account created
**Business Rule**: `authService.register` — `userRepository.findByEmail` check prevents duplicates
**Suggested Layer**: E2E / API

---

### TC-414: Login loading state — button text and disabled state
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Valid credentials ready; simulate slow network
**Steps**:
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Sign In" and immediately inspect button state
**Expected Results**: Button text changes to "Signing in…"; button is `disabled` with `opacity-60` styling while request is in flight
**Business Rule**: `loading` state in `LoginPage` — `setLoading(true)` on submit, `setLoading(false)` in `finally`
**Suggested Layer**: E2E / Component

---

## UI State

### TC-500: Bookings list shows skeleton loading state while fetching
**Category**: UI State
**Priority**: P1
**Preconditions**: User navigates to `/bookings` (slow network or first load)
**Steps**:
1. Navigate to `/bookings` with throttled network
2. Observe the page before data loads
**Expected Results**: 5 `BookingCardSkeleton` placeholders are shown while `isLoading = true`; no real booking data yet
**Business Rule**: `isLoading` branch in `BookingsContent`
**Suggested Layer**: Component / E2E

---

### TC-501: Bookings list shows empty state when user has no bookings
**Category**: UI State
**Priority**: P1
**Preconditions**: User is logged in with zero bookings
**Steps**:
1. Navigate to `/bookings`
**Expected Results**: Empty state renders with "No bookings yet", "You haven't booked any events yet..." description, and "Browse Events" button linking to `/events`
**Business Rule**: `bookings.length === 0` branch in `BookingsContent`
**Suggested Layer**: E2E / Component

---

### TC-502: Booking detail page shows loading spinner while fetching
**Category**: UI State
**Priority**: P2
**Preconditions**: User navigates to `/bookings/:id` on slow network
**Steps**:
1. Navigate to `/bookings/:id` with throttled network
2. Observe the page before data loads
**Expected Results**: Full-screen spinner (`Spinner size="lg"`) is visible while `isLoading = true`
**Business Rule**: `isLoading` branch in `BookingDetailPage`
**Suggested Layer**: Component

---

### TC-503: Cancel booking confirmation dialog appears before deletion
**Category**: UI State
**Priority**: P0
**Preconditions**: User is on a booking detail page
**Steps**:
1. Click "Cancel Booking" button
2. Observe dialog
**Expected Results**: `ConfirmDialog` appears with title "Cancel this booking?", description mentioning the booking ref and seat count, "Yes, cancel it" and close buttons
**Business Rule**: Two-step confirmation prevents accidental cancellations
**Suggested Layer**: E2E / Component

---

### TC-504: Cancel booking dialog close without confirming does NOT cancel
**Category**: UI State
**Priority**: P1
**Preconditions**: User is on a booking detail page
**Steps**:
1. Click "Cancel Booking"
2. Click the close/dismiss button on the dialog (not "Yes, cancel it")
3. Observe booking status
**Expected Results**: Dialog closes; booking remains in the list; no API call made
**Business Rule**: `onClose` sets `confirm = false`; `handleCancel` only runs on confirm
**Suggested Layer**: E2E

---

### TC-505: Booking detail breadcrumb displays the booking reference
**Category**: UI State
**Priority**: P2
**Preconditions**: User navigates to a valid booking detail page
**Steps**:
1. Navigate to `/bookings/:id`
2. Observe the breadcrumb nav at the top
**Expected Results**: Breadcrumb shows "My Bookings / {bookingRef}" where bookingRef is in monospace font
**Business Rule**: Breadcrumb uses `booking.bookingRef`
**Suggested Layer**: E2E

---

### TC-506: Cancel booking success — toast and redirect
**Category**: UI State
**Priority**: P0
**Preconditions**: User confirms booking cancellation
**Steps**:
1. Confirm cancellation in the dialog
2. Observe page transition and notifications
**Expected Results**: Success toast "Booking cancelled successfully" appears; user is redirected to `/bookings`
**Business Rule**: `onSuccess` callback in `handleCancel`
**Suggested Layer**: E2E

---

### TC-507: "Clear all bookings" button shows "Clearing..." while in progress
**Category**: UI State
**Priority**: P2
**Preconditions**: User has bookings; network is slow
**Steps**:
1. Click "Clear all bookings" and confirm dialog
2. Observe the button state while request is in flight
**Expected Results**: Button text changes to "Clearing…" and is disabled (`disabled:opacity-50`) during the API call
**Business Rule**: `clearing` state variable in `BookingsContent`
**Suggested Layer**: Component / E2E

---

### TC-508: Refund eligibility — "Check eligibility" button hidden after result shown
**Category**: UI State
**Priority**: P2
**Preconditions**: User is on a booking detail page in idle refund state
**Steps**:
1. Click "Check eligibility for refund?"
2. Wait for result to appear
**Expected Results**: After status transitions from "idle" → "checking" → "eligible/ineligible", the initial button is no longer visible; spinner replaces it during check; result card replaces spinner after 4 seconds
**Business Rule**: `RefundEligibility` component status state machine: idle → checking → eligible/ineligible
**Suggested Layer**: E2E / Component

---

### TC-509: Booking detail shows "Access Denied" state for 403 errors
**Category**: UI State
**Priority**: P0
**Preconditions**: Another user's booking ID is known
**Steps**:
1. Log in as User B
2. Navigate to `/bookings/:userA_booking_id`
3. Observe the rendered state
**Expected Results**: `EmptyState` with title "Access Denied" and description "You are not authorized to view this booking." renders (not "Booking not found")
**Business Rule**: Frontend checks `error.status === 403` to differentiate Access Denied vs Not Found
**Suggested Layer**: E2E

---

### TC-510: Bookings page pagination UI renders when total exceeds page size
**Category**: UI State
**Priority**: P2
**Preconditions**: API returns `pagination.totalPages > 1`
**Steps**:
1. Navigate to `/bookings` with enough bookings to trigger multi-page response
2. Observe pagination controls
**Expected Results**: `Pagination` component renders with correct `currentPage` and `totalPages`; clicking next page updates URL `?page=N` and loads next page of bookings
**Business Rule**: Pagination in `BookingsContent` driven by `pagination` from API response
**Suggested Layer**: E2E / Component

---

### TC-520: Registration — "Create Account" button shows loading state during submission
**Category**: UI State
**Priority**: P1
**Preconditions**: Valid form data ready; simulate slow network
**Steps**:
1. Fill all registration fields with valid data
2. Click `[data-testid="register-btn"]`
3. Immediately inspect the button
**Expected Results**: Button text changes to "Creating account…"; button is `disabled` (opacity-60) during the API call
**Business Rule**: `loading` state in `RegisterPage` — `setLoading(true)` on submit, `setLoading(false)` in `finally`
**Suggested Layer**: E2E / Component

---

### TC-521: Registration password strength checklist is hidden until user starts typing
**Category**: UI State
**Priority**: P2
**Preconditions**: User is on `/register` with an empty password field
**Steps**:
1. Observe `#password-guidelines` on initial page load (password field empty)
2. Start typing in `[data-testid="register-password"]`
**Expected Results**: When password is empty, all four rules show a circle icon (gray); once first character is typed, rules begin evaluating and icons may become checkmarks; the list is always visible but inactive until typing begins
**Business Rule**: Frontend condition: `const passed = password.length > 0 && test(password)` — rules only "pass" once typing has started
**Suggested Layer**: E2E / Component

---

### TC-522: Login — field-level inline errors appear below each field (not as toast)
**Category**: UI State
**Priority**: P1
**Preconditions**: User is on `/login`
**Steps**:
1. Type an invalid email (e.g., `badformat`) in the email field
2. Type a short password (e.g., `abc`) in the password field
3. Click "Sign In"
**Expected Results**: Inline `<p class="text-red-600">` errors appear directly below each field ("Enter a valid email", "Password must be at least 6 characters"); no toast notification shown for client-side errors
**Business Rule**: `errors` state in `LoginPage` — set by `validate()` before any API call is attempted
**Suggested Layer**: E2E

---

### TC-523: Demo email warning banner replaces error toast on failed login
**Category**: UI State
**Priority**: P1
**Preconditions**: Demo email `rahulshetty1@gmail.com` fails login (does not exist or has wrong password in test env)
**Steps**:
1. Navigate to `/login`
2. Enter `rahulshetty1@gmail.com` and any wrong password
3. Click "Sign In"
**Expected Results**: Amber warning banner is rendered inline in the form (not a toast): "Looks like you're using sample test credentials!" with a "Sign up now" link to `/register`; no error toast appears
**Business Rule**: Frontend checks `DEMO_EMAILS.includes(email)` in the catch block to decide whether to show toast or amber banner
**Suggested Layer**: E2E

---

### TC-524: Registration inline error for confirm password mismatch clears on correction
**Category**: UI State
**Priority**: P2
**Preconditions**: User has filled mismatched passwords and seen the error
**Steps**:
1. Submit the form with mismatched confirm password (triggers "Passwords do not match" error)
2. Correct the confirm password to match the password
3. Submit again
**Expected Results**: Error message disappears on the second successful submit; form proceeds to API call
**Business Rule**: `setErrors({})` called at start of each `submit()` invocation before re-validation
**Suggested Layer**: E2E

---

### TC-525: Login page — API documentation link is visible and navigates to Swagger UI
**Category**: UI State
**Priority**: P3
**Preconditions**: User is on `/login`
**Steps**:
1. Locate the "API Documentation (Swagger)" link on the login page
2. Click it
**Expected Results**: A new tab opens with the Swagger UI at the backend `/docs` URL; API docs load successfully
**Business Rule**: Login page renders a link to `${BASE_URL}/docs` — helps QA engineers discover the API reference
**Suggested Layer**: E2E
