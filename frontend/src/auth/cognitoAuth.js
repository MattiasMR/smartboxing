// Custom Cognito Authentication (No Hosted UI)
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

/**
 * Sign up a new user
 * @param {string} email
 * @param {string} password
 * @param {object} attributes - Additional attributes like name, tenantId, tenantName
 * @returns {Promise}
 */
export const signUp = (email, password, attributes = {}) => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    // Add additional attributes
    const { name, tenantId, tenantName } = attributes;
    
    if (name) {
      attributeList.push(
        new CognitoUserAttribute({ Name: 'name', Value: name })
      );
    }
    
    // Custom attributes need 'custom:' prefix
    if (tenantId) {
      attributeList.push(
        new CognitoUserAttribute({ Name: 'custom:tenantId', Value: tenantId })
      );
    }
    
    if (tenantName) {
      attributeList.push(
        new CognitoUserAttribute({ Name: 'custom:tenantName', Value: tenantName })
      );
    }
    
    // Default role is tenant_admin for self-registered users
    // They will be able to request tenancies after registration
    // Staff users are created by tenant_admins through the admin panel
    attributeList.push(
      new CognitoUserAttribute({ Name: 'custom:role', Value: 'tenant_admin' })
    );

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.error('SignUp error:', err);
        reject(err);
        return;
      }
      console.log('SignUp success:', result);
      resolve(result);
    });
  });
};

/**
 * Confirm email with verification code
 * @param {string} email
 * @param {string} code
 * @returns {Promise}
 */
export const confirmSignUp = (email, code) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('Confirmation error:', err);
        reject(err);
        return;
      }
      console.log('Confirmation success:', result);
      resolve(result);
    });
  });
};

/**
 * Sign in user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken, idToken, refreshToken}>}
 */
export const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: email,
      Password: password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log('Authentication success');
        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        resolve({
          accessToken,
          idToken,
          refreshToken,
          user: cognitoUser,
        });
      },
      onFailure: (err) => {
        console.error('Authentication error:', err);
        reject(err);
      },
      newPasswordRequired: () => {
        // Handle new password required
        // userAttributes and requiredAttributes intentionally not used
        console.log('New password required');
        reject(new Error('NEW_PASSWORD_REQUIRED'));
      },
    });
  });
};

/**
 * Sign out current user
 */
export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

/**
 * Force refresh the session to get updated tokens with new custom attributes
 * This is needed after backend changes user attributes (like tenantId)
 * @returns {Promise<{accessToken, idToken, refreshToken}>}
 */
export const forceRefreshSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    // First get current session to get the refresh token
    cognitoUser.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      const refreshToken = session.getRefreshToken();
      
      // Force refresh using the refresh token
      cognitoUser.refreshSession(refreshToken, (refreshErr, newSession) => {
        if (refreshErr) {
          console.error('Error refreshing session:', refreshErr);
          reject(refreshErr);
          return;
        }

        resolve({
          accessToken: newSession.getAccessToken().getJwtToken(),
          idToken: newSession.getIdToken().getJwtToken(),
          refreshToken: newSession.getRefreshToken().getToken(),
        });
      });
    });
  });
};

/**
 * Get current authenticated user
 * @returns {Promise<CognitoUser>}
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session.isValid()) {
        reject(new Error('Session is not valid'));
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        const userData = {};
        attributes.forEach((attr) => {
          userData[attr.Name] = attr.Value;
        });

        resolve({
          ...userData,
          username: cognitoUser.getUsername(),
          session,
        });
      });
    });
  });
};

/**
 * Get current session tokens
 * @returns {Promise<{accessToken, idToken, refreshToken}>}
 */
export const getSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session.isValid()) {
        reject(new Error('Session is not valid'));
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
};

/**
 * Forgot password - send verification code
 * @param {string} email
 * @returns {Promise}
 */
export const forgotPassword = (email) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.forgotPassword({
      onSuccess: (result) => {
        console.log('Password reset code sent:', result);
        resolve(result);
      },
      onFailure: (err) => {
        console.error('Forgot password error:', err);
        reject(err);
      },
    });
  });
};

/**
 * Reset password with code
 * @param {string} email
 * @param {string} code
 * @param {string} newPassword
 * @returns {Promise}
 */
export const resetPassword = (email, code, newPassword) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        console.log('Password reset successful');
        resolve();
      },
      onFailure: (err) => {
        console.error('Password reset error:', err);
        reject(err);
      },
    });
  });
};
