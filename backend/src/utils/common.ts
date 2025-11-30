import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Response utilities
export const createResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

export const createSuccessResponse = (data: any) => {
  return createResponse(200, {
    success: true,
    data,
  });
};

export const createErrorResponse = (statusCode: number, error: string, details?: any) => {
  return createResponse(statusCode, {
    success: false,
    error,
    details,
  });
};

// Parse JSON body
export const parseBody = (event: APIGatewayProxyEvent) => {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

// Get user ID from JWT token
export const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  // First try API Gateway authorizer (if configured)
  const claims = event.requestContext.authorizer?.claims;
  if (claims?.sub) {
    logger.info('Got userId from authorizer', { sub: claims.sub });
    return claims.sub;
  }
  
  // Fall back to Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  logger.info('Auth header check', { hasAuth: !!authHeader, headers: Object.keys(event.headers || {}) });
  
  if (!authHeader) {
    return null;
  }
  
  try {
    // Extract token from "Bearer <token>"
    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    // Decode without verification (verification should be done by Cognito/API Gateway)
    // We're just extracting the claims here
    const decoded = jwt.decode(token) as any;
    
    logger.info('Decoded JWT', { hasSub: !!decoded?.sub, hasEmail: !!decoded?.email });
    return decoded?.sub || null;
  } catch (error) {
    logger.error('Error decoding JWT token', error);
    return null;
  }
};

// Check if user is admin
export const isAdmin = (event: APIGatewayProxyEvent): boolean => {
  // First try API Gateway authorizer (if configured)
  const authorizerGroups = event.requestContext.authorizer?.claims?.['cognito:groups'];
  if (authorizerGroups) {
    if (typeof authorizerGroups === 'string') {
      return authorizerGroups.split(',').includes('Admins');
    }
    if (Array.isArray(authorizerGroups)) {
      return authorizerGroups.includes('Admins');
    }
  }
  
  // Fall back to Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    return false;
  }
  
  try {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = jwt.decode(token) as any;
    
    const groups = decoded?.['cognito:groups'];
    if (!groups) return false;
    
    if (typeof groups === 'string') {
      return groups.split(',').includes('Admins');
    }
    if (Array.isArray(groups)) {
      return groups.includes('Admins');
    }
    return false;
  } catch (error) {
    logger.error('Error decoding JWT token for admin check', error);
    return false;
  }
};

// Environment variables
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (obj: Record<string, any>, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !obj[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

// Generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Logging utility
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
};