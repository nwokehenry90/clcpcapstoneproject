import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
};

// Check if Cognito is configured
const isCognitoConfigured = poolData.UserPoolId && poolData.ClientId;

const userPool = isCognitoConfigured ? new CognitoUserPool(poolData) : null;

export interface AuthUser {
  username: string;
  email: string;
  attributes: {
    email: string;
    email_verified: boolean;
    name?: string;
  };
}

class AuthService {
  private checkCognitoConfigured(): void {
    if (!userPool) {
      throw new Error('Cognito is not configured. Please set REACT_APP_COGNITO_USER_POOL_ID and REACT_APP_COGNITO_CLIENT_ID in your .env file.');
    }
  }

  // Sign Up
  async signUp(email: string, password: string, name: string): Promise<any> {
    this.checkCognitoConfigured();
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
        new CognitoUserAttribute({
          Name: 'name',
          Value: name,
        }),
      ];

      userPool!.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Confirm Sign Up with verification code
  async confirmSignUp(email: string, code: string): Promise<any> {
    this.checkCognitoConfigured();
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool!,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Sign In
  async signIn(email: string, password: string): Promise<any> {
    this.checkCognitoConfigured();
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: email,
        Password: password,
      };

      const authenticationDetails = new AuthenticationDetails(authenticationData);

      const userData = {
        Username: email,
        Pool: userPool!,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          reject(new Error('New password required'));
        },
      });
    });
  }

  // Sign Out
  signOut(): void {
    if (!userPool) return;
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

  // Get current user
  getCurrentUser(): CognitoUser | null {
    if (!userPool) return null;
    return userPool.getCurrentUser();
  }

  // Get current user session
  async getCurrentSession(): Promise<any> {
    if (!userPool) throw new Error('Cognito not configured');
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool!.getCurrentUser();

      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      });
    });
  }

  // Get user attributes
  async getUserAttributes(): Promise<AuthUser | null> {
    if (!userPool) return null;
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool!.getCurrentUser();

      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
          return;
        }

        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }

          if (!attributes) {
            resolve(null);
            return;
          }

          const userAttributes: any = {};
          attributes.forEach((attr) => {
            userAttributes[attr.Name] = attr.Value;
          });

          const authUser: AuthUser = {
            username: cognitoUser.getUsername(),
            email: userAttributes.email,
            attributes: {
              email: userAttributes.email,
              email_verified: userAttributes.email_verified === 'true',
              name: userAttributes.name,
            },
          };

          resolve(authUser);
        });
      });
    });
  }

  // Get ID Token (for API calls)
  async getIdToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  // Forgot Password - Send reset code
  async forgotPassword(email: string): Promise<any> {
    this.checkCognitoConfigured();
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool!,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  // Confirm Password Reset
  async confirmPassword(email: string, code: string, newPassword: string): Promise<any> {
    this.checkCognitoConfigured();
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool!,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve('Password reset successful');
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentSession();
      return true;
    } catch (error) {
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;