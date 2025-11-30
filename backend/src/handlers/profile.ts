import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ProfileService } from '../services/dynamodb';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseBody,
  logger,
  getUserIdFromEvent
} from '../utils/common';
import { ProfileUpdateRequest } from '../types';

const profileService = new ProfileService();

/**
 * GET /api/profile
 * Get current user's profile
 */
export const getProfile = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized');
    }

    let profile = await profileService.getProfile(userId);
    
    // If profile doesn't exist, create a default one
    if (!profile) {
      // Extract email and name from JWT token
      let email = '';
      let name = '';
      
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (authHeader) {
        try {
          const token = authHeader.replace(/^Bearer\s+/i, '');
          const decoded = jwt.decode(token) as any;
          email = decoded?.email || '';
          name = decoded?.name || decoded?.['cognito:username'] || '';
        } catch (error) {
          logger.error('Error decoding token for profile creation', error);
        }
      }
      
      profile = await profileService.createProfile({
        userId,
        email,
        name,
        isCertified: false,
        certifiedSkills: [],
      });
    }

    return createSuccessResponse(profile);
  } catch (error) {
    logger.error('Error getting profile', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * PUT /api/profile
 * Update current user's profile
 */
export const updateProfile = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized');
    }

    const updates: ProfileUpdateRequest = parseBody(event);

    // Validate date of birth format if provided
    if (updates.dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(updates.dateOfBirth)) {
        return createErrorResponse(400, 'Invalid date format. Use YYYY-MM-DD');
      }
    }

    // Validate phone number format if provided
    if (updates.phoneNumber) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(updates.phoneNumber)) {
        return createErrorResponse(400, 'Invalid phone number format');
      }
    }

    const updatedProfile = await profileService.updateProfile(userId, updates);

    return createSuccessResponse(updatedProfile);
  } catch (error) {
    logger.error('Error updating profile', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
