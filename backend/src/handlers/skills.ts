import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SkillService } from '../services/dynamodb';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseBody, 
  validateRequired,
  logger 
} from '../utils/common';

const skillService = new SkillService();

export const getSkills = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting all skills');
    
    const category = event.queryStringParameters?.category;
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 50;
    const lastKey = event.queryStringParameters?.lastKey;
    
    const result = await skillService.getAllSkills(category, limit, lastKey);
    
    return createSuccessResponse({
      skills: result.items,
      lastEvaluatedKey: result.lastEvaluatedKey,
      total: result.items.length
    });
  } catch (error) {
    logger.error('Error getting skills', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const getSkill = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting single skill');
    
    const skillId = event.pathParameters?.id;
    if (!skillId) {
      return createErrorResponse(400, 'Skill ID is required');
    }
    
    const skill = await skillService.getSkill(skillId);
    if (!skill) {
      return createErrorResponse(404, 'Skill not found');
    }
    
    return createSuccessResponse(skill);
  } catch (error) {
    logger.error('Error getting skill', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const createSkill = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Creating new skill');
    
    const skillData = parseBody(event);
    
    validateRequired(skillData, ['title', 'description', 'userName', 'userEmail', 'category', 'location']);
    
    // Basic validation
    if (skillData.title.length < 5) {
      return createErrorResponse(400, 'Title must be at least 5 characters long');
    }
    
    if (skillData.description.length < 20) {
      return createErrorResponse(400, 'Description must be at least 20 characters long');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(skillData.userEmail)) {
      return createErrorResponse(400, 'Invalid email address');
    }
    
    const skill = await skillService.createSkill(skillData);
    
    return createSuccessResponse(skill);
  } catch (error) {
    logger.error('Error creating skill', error);
    if (error instanceof Error) {
      return createErrorResponse(400, error.message);
    }
    return createErrorResponse(500, 'Internal server error');
  }
};

export const updateSkill = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Updating skill');
    
    const skillId = event.pathParameters?.id;
    if (!skillId) {
      return createErrorResponse(400, 'Skill ID is required');
    }
    
    const updates = parseBody(event);
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const updatedSkill = await skillService.updateSkill(skillId, updates);
    if (!updatedSkill) {
      return createErrorResponse(404, 'Skill not found');
    }
    
    return createSuccessResponse(updatedSkill);
  } catch (error) {
    logger.error('Error updating skill', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const deleteSkill = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Deleting skill');
    
    const skillId = event.pathParameters?.id;
    if (!skillId) {
      return createErrorResponse(400, 'Skill ID is required');
    }
    
    await skillService.deleteSkill(skillId);
    
    return createSuccessResponse({ message: 'Skill deleted successfully' });
  } catch (error) {
    logger.error('Error deleting skill', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const searchSkills = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Searching skills');
    
    const searchTerm = event.queryStringParameters?.q;
    const category = event.queryStringParameters?.category;
    const location = event.queryStringParameters?.location;
    
    if (!searchTerm && !category && !location) {
      return createErrorResponse(400, 'At least one search parameter is required');
    }
    
    const results = await skillService.searchSkills(searchTerm, category, location);
    
    return createSuccessResponse({
      skills: results,
      total: results.length
    });
  } catch (error) {
    logger.error('Error searching skills', error);
    return createErrorResponse(500, 'Internal server error');
  }
};