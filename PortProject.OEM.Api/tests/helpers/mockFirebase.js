/**
 * Mock Firebase Authentication Middleware for Testing
 * Bypasses real Firebase authentication during tests
 */

/**
 * Mock verifyFirebaseToken middleware that simulates authentication
 * without requiring real Firebase setup
 */
export const mockVerifyFirebaseToken = (req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  // Mock different users based on token
  if (token === 'mock-valid-token') {
    req.user = {
      uid: 'test-user-123',
      email: 'testuser@example.com',
      email_verified: true
    };
    return next();
  } else if (token === 'mock-admin-token') {
    req.user = {
      uid: 'admin-user-456',
      email: 'admin@example.com',
      email_verified: true,
      role: 'admin'
    };
    return next();
  } else if (token === 'mock-invalid-token') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  } else {
    // Default mock user for any other token
    req.user = {
      uid: 'default-user-789',
      email: 'default@example.com',
      email_verified: true
    };
    return next();
  }
};

/**
 * Replace the real Firebase middleware with the mock in the config
 */
export const setupMockFirebase = () => {
  // This function can be used to inject mocks if needed
  // For now, we'll mock at the route level in tests
};

