// Tests for the access control middleware (src/middleware/auth.js).
jest.mock('../src/repositories/userRepository');

const userRepository = require('../src/repositories/userRepository');
const { requireAuth, requireRole } = require('../src/middleware/auth');

/** Builds a minimal fake req/res pair for middleware tests. */
function makeReqRes(sessionUser) {
  const req = {
    session: { user: sessionUser, destroy(callback) { this.destroyed = true; callback(); } },
    flash: jest.fn(),
  };
  const res = {
    redirect: jest.fn(),
    clearCookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('requireAuth', () => {
  test('redirects a guest to the login page', async () => {
    const { req, res, next } = makeReqRes(null);

    await requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('allows an active user and refreshes the session copy', async () => {
    const { req, res, next } = makeReqRes({ id: 1, role: 'PASSENGER' });
    userRepository.findById.mockResolvedValue({
      id: 1, name: 'Ali', email: 'a@b.c', role: 'PASSENGER', is_active: true,
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.user.name).toBe('Ali');
  });

  test('logs out a deactivated user', async () => {
    const { req, res, next } = makeReqRes({ id: 1, role: 'PASSENGER' });
    userRepository.findById.mockResolvedValue({
      id: 1, name: 'Ali', email: 'a@b.c', role: 'PASSENGER', is_active: false,
    });

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });
});

describe('requireRole', () => {
  test('allows a user with the required role', () => {
    const { req, res, next } = makeReqRes({ id: 1, role: 'DRIVER' });

    requireRole('DRIVER')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('rejects a passenger accessing driver pages', () => {
    const { req, res, next } = makeReqRes({ id: 1, role: 'PASSENGER' });

    requireRole('DRIVER')(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  test('rejects a driver accessing admin pages', () => {
    const { req, res, next } = makeReqRes({ id: 2, role: 'DRIVER' });

    requireRole('ADMIN')(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  test('rejects a guest with no session user', () => {
    const { req, res, next } = makeReqRes(null);

    requireRole('PASSENGER')(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });
});
