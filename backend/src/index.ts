import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  getSkills, 
  getSkill, 
  createSkill, 
  updateSkill, 
  deleteSkill, 
  searchSkills 
} from './handlers/skills';
import { getProfile, updateProfile } from './handlers/profile';
import { uploadCertification, getUserCertifications, deleteCertification } from './handlers/certifications';
import { getPendingCertifications, approveCertification, rejectCertification } from './handlers/admin';
import { healthCheck, corsHandler } from './handlers/health';
import { logger } from './utils/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Request received', {
    method: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHandler();
  }

  const { httpMethod, path } = event;

  try {
    // Health check
    if (httpMethod === 'GET' && path === '/health') {
      return healthCheck();
    }

    // Skills routes
    if (path.startsWith('/api/skills')) {
      if (httpMethod === 'GET' && path === '/api/skills') {
        return getSkills(event);
      }
      
      if (httpMethod === 'POST' && path === '/api/skills') {
        return createSkill(event);
      }
      
      if (httpMethod === 'GET' && path === '/api/skills/search') {
        return searchSkills(event);
      }
      
      // Handle individual skill routes: /api/skills/{id}
      const skillIdMatch = path.match(/^\/api\/skills\/([^/]+)$/);
      if (skillIdMatch) {
        const skillId = skillIdMatch[1];
        // Set the skill ID in path parameters for handlers
        event.pathParameters = { id: skillId };
        
        if (httpMethod === 'GET') {
          return getSkill(event);
        }
        
        if (httpMethod === 'PUT') {
          return updateSkill(event);
        }
        
        if (httpMethod === 'DELETE') {
          return deleteSkill(event);
        }
      }
    }

    // Profile routes
    if (path === '/api/profile') {
      if (httpMethod === 'GET') {
        return getProfile(event);
      }
      if (httpMethod === 'PUT') {
        return updateProfile(event);
      }
    }

    // Certifications routes
    if (path.startsWith('/api/certifications')) {
      if (httpMethod === 'GET' && path === '/api/certifications') {
        return getUserCertifications(event);
      }
      
      if (httpMethod === 'POST' && path === '/api/certifications') {
        return uploadCertification(event);
      }
      
      // Handle individual certification routes: /api/certifications/{id}
      const certIdMatch = path.match(/^\/api\/certifications\/([^/]+)$/);
      if (certIdMatch && httpMethod === 'DELETE') {
        const certId = certIdMatch[1];
        event.pathParameters = { id: certId };
        return deleteCertification(event);
      }
    }

    // Admin routes
    if (path.startsWith('/api/admin')) {
      // GET /api/admin/certifications - Get pending certifications
      if (httpMethod === 'GET' && path === '/api/admin/certifications') {
        return getPendingCertifications(event);
      }
      
      // POST /api/admin/certifications/{id}/approve
      const approveMatch = path.match(/^\/api\/admin\/certifications\/([^/]+)\/approve$/);
      if (approveMatch && httpMethod === 'POST') {
        const certId = approveMatch[1];
        event.pathParameters = { id: certId };
        return approveCertification(event);
      }
      
      // POST /api/admin/certifications/{id}/reject
      const rejectMatch = path.match(/^\/api\/admin\/certifications\/([^/]+)\/reject$/);
      if (rejectMatch && httpMethod === 'POST') {
        const certId = rejectMatch[1];
        event.pathParameters = { id: certId };
        return rejectCertification(event);
      }
    }

    // If no route matches, return 404
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Route not found',
      }),
    };

  } catch (error) {
    logger.error('Unhandled error', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
    };
  }
};