import admin from 'firebase-admin';

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * This allows us to verify JWT tokens from Firebase Authentication
 */
export const initializeFirebase = (projectId) => {
  if (!firebaseApp) {
    try {
      firebaseApp = admin.initializeApp({
        projectId: projectId,
      });
      console.log(`[Firebase] Initialized with project: ${projectId}`);
    } catch (error) {
      console.error('[Firebase] Initialization failed:', error.message);
      throw error;
    }
  }
  return firebaseApp;
};

/**
 * Middleware to verify Firebase JWT token
 * Equivalent to [Authorize] attribute in C#
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request object (similar to User claims in C#)
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...decodedToken
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Middleware that allows anonymous access
 * Equivalent to [AllowAnonymous] in C#
 */
export const allowAnonymous = (req, res, next) => {
  next();
};

