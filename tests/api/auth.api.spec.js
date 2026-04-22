import { test, expect } from '@playwright/test';

const API_BASE      = 'https://api.eventhub.rahulshettyacademy.com/api';
const USER_EMAIL    = 'rahulshetty1@yahoo.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Helper ─────────────────────────────────────────────────────────────────────

async function getAuthToken(request, email = USER_EMAIL, password = USER_PASSWORD) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login failed for ${email}: ${body.error}`);
  return body.token;
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Auth API — Registration & Login', () => {

  // TC-014 ───────────────────────────────────────────────────────────────────
  test('TC-014: GET /api/auth/me returns authenticated user identity', async ({ request }) => {
    // -- Step 1: Obtain JWT token via login --
    const token = await getAuthToken(request);
    console.log('Login successful, token obtained');

    // -- Step 2: Call GET /api/auth/me with the Bearer token --
    const res = await request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // -- Step 3: Assert 200 with correct response structure --
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(typeof body.user.userId).toBe('number');
    expect(body.user.email).toBe(USER_EMAIL);
    console.log(`/auth/me returned userId=${body.user.userId}, email=${body.user.email}`);
  });

  // TC-111 ───────────────────────────────────────────────────────────────────
  test('TC-111: POST /api/auth/register with duplicate email returns 400', async ({ request }) => {
    // -- Step 1: Register a brand-new unique account --
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const firstRes = await request.post(`${API_BASE}/auth/register`, {
      data: { email: uniqueEmail, password: 'Test@1234' },
    });
    expect(firstRes.status()).toBe(201);
    console.log(`First registration succeeded for ${uniqueEmail}`);

    // -- Step 2: Attempt to register the same email again --
    const dupRes = await request.post(`${API_BASE}/auth/register`, {
      data: { email: uniqueEmail, password: 'Test@1234' },
    });

    // -- Step 3: Assert 400 with exact error message --
    expect(dupRes.status()).toBe(400);
    const body = await dupRes.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Email already registered');
    console.log(`Duplicate registration correctly rejected with: "${body.error}"`);
  });

  // TC-112 ───────────────────────────────────────────────────────────────────
  test('TC-112: wrong password and non-existent email return identical error messages', async ({ request }) => {
    // -- Step 1: Login with correct email but wrong password --
    const wrongPwdRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: USER_EMAIL, password: 'WrongPassword999!' },
    });
    expect(wrongPwdRes.status()).toBe(400);
    const wrongPwdBody = await wrongPwdRes.json();
    expect(wrongPwdBody.success).toBe(false);
    console.log(`Wrong password error: "${wrongPwdBody.error}"`);

    // -- Step 2: Login with an email that has never been registered --
    const ghostEmail = `ghost_${Date.now()}@noemail.com`;
    const ghostRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: ghostEmail, password: USER_PASSWORD },
    });
    expect(ghostRes.status()).toBe(400);
    const ghostBody = await ghostRes.json();
    expect(ghostBody.success).toBe(false);
    console.log(`Non-existent email error: "${ghostBody.error}"`);

    // -- Step 3: Both messages must be identical (prevents email enumeration) --
    expect(wrongPwdBody.error).toBe(ghostBody.error);
    expect(wrongPwdBody.error).toBe('Invalid email or password');
    console.log('Both failure paths return identical message — email enumeration prevented ✓');
  });

});
