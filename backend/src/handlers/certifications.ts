import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { CertificationService, ProfileService } from '../services/dynamodb';
import { S3Service } from '../services/s3';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseBody,
  logger,
  getUserIdFromEvent,
  getCurrentTimestamp
} from '../utils/common';
import { CertificationUploadRequest } from '../types';

const certificationService = new CertificationService();
const profileService = new ProfileService();
const s3Service = new S3Service();

/**
 * POST /api/certifications
 * Upload a new certification
 */
export const uploadCertification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized');
    }

    // Extract email and name from JWT token
    let userEmail = '';
    let userName = '';
    
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const decoded = jwt.decode(token) as any;
        userEmail = decoded?.email || '';
        userName = decoded?.name || decoded?.['cognito:username'] || '';
      } catch (error) {
        logger.error('Error decoding token', error);
      }
    }

    const certData: CertificationUploadRequest = parseBody(event);

    // Validate required fields
    if (!certData.skillCategory || !certData.certificateType || !certData.certificateTitle || 
        !certData.issuingOrganization || !certData.issueDate || !certData.fileName || !certData.fileSize) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Validate file is PDF
    if (!certData.fileName.toLowerCase().endsWith('.pdf')) {
      return createErrorResponse(400, 'Only PDF files are allowed');
    }

    // Validate file size (5MB max)
    if (certData.fileSize > 5 * 1024 * 1024) {
      return createErrorResponse(400, 'File size must be less than 5MB');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(certData.issueDate)) {
      return createErrorResponse(400, 'Invalid date format. Use YYYY-MM-DD');
    }

    // Generate S3 upload URL
    const { uploadUrl, key } = await s3Service.generateCertUploadUrl(userId, certData.fileName, certData.fileSize);

    // Create certification record
    const certification = await certificationService.createCertification({
      userId,
      userEmail,
      userName,
      skillCategory: certData.skillCategory,
      certificateType: certData.certificateType,
      certificateTitle: certData.certificateTitle,
      issuingOrganization: certData.issuingOrganization,
      issueDate: certData.issueDate,
      documentKey: key,
      fileSize: certData.fileSize,
    });

    return createSuccessResponse({
      certification,
      uploadUrl,
    });
  } catch (error) {
    logger.error('Error uploading certification', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * GET /api/certifications
 * Get current user's certifications
 */
export const getUserCertifications = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized');
    }

    const certifications = await certificationService.getUserCertifications(userId);

    // Generate download URLs for approved certifications
    const certificationsWithUrls = await Promise.all(
      certifications.map(async (cert) => {
        if (cert.documentKey) {
          const downloadUrl = await s3Service.getCertDownloadUrl(cert.documentKey);
          return { ...cert, documentUrl: downloadUrl };
        }
        return cert;
      })
    );

    return createSuccessResponse(certificationsWithUrls);
  } catch (error) {
    logger.error('Error getting certifications', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * DELETE /api/certifications/:id
 * Delete a pending certification
 */
export const deleteCertification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized');
    }

    const certificationId = event.pathParameters?.id;
    if (!certificationId) {
      return createErrorResponse(400, 'Certification ID is required');
    }

    // Get certification to verify ownership
    const certification = await certificationService.getCertification(certificationId);
    if (!certification) {
      return createErrorResponse(404, 'Certification not found');
    }

    if (certification.userId !== userId) {
      return createErrorResponse(403, 'Forbidden');
    }

    // Only allow deleting pending certifications
    if (certification.status !== 'pending') {
      return createErrorResponse(400, 'Can only delete pending certifications');
    }

    // Delete from S3
    if (certification.documentKey) {
      await s3Service.deleteCertification(certification.documentKey);
    }

    // Delete from DynamoDB
    await certificationService.deleteCertification(certificationId);

    return createSuccessResponse({ message: 'Certification deleted successfully' });
  } catch (error) {
    logger.error('Error deleting certification', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
