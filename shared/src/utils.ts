import { AppError, ErrorCodes } from './types';

// Environment configuration
export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID || '',
    identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
    dynamoTablePrefix: process.env.DYNAMO_TABLE_PREFIX || 'CloudNativeApp'
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || '',
    timeout: 30000
  }
};

// Common utility functions
export class AppErrorUtil {
  static createError(code: ErrorCodes, message: string, details?: any): AppError {
    return { code, message, details };
  }

  static isAppError(error: any): error is AppError {
    return error && typeof error.code === 'string' && typeof error.message === 'string';
  }
}

// Validation utilities
export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateFile(file: Blob, maxSizeBytes: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File size exceeds ${maxSizeBytes / (1024 * 1024)}MB limit` };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please use JPEG, PNG, GIF, or WebP' };
    }

    return { valid: true };
  }
}

// Date utilities
export class DateUtil {
  static toISOString(date?: Date): string {
    return (date || new Date()).toISOString();
  }

  static fromISOString(dateString: string): Date {
    return new Date(dateString);
  }

  static formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
}

// Generate unique IDs
export class IdUtil {
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  static generateUserId(): string {
    return `user_${this.generateId()}`;
  }

  static generatePictureId(): string {
    return `pic_${this.generateId()}`;
  }
}

// Storage key utilities
export class StorageUtil {
  static getUserKey(userId: string): string {
    return `users/${userId}`;
  }

  static getPictureKey(userId: string, pictureId: string, filename: string): string {
    const extension = filename.split('.').pop() || '';
    return `pictures/${userId}/${pictureId}.${extension}`;
  }

  static getThumbnailKey(pictureKey: string): string {
    const parts = pictureKey.split('.');
    const extension = parts.pop();
    return `${parts.join('.')}_thumb.${extension}`;
  }
}