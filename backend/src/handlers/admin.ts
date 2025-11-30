import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CertificationService, ProfileService, SkillService } from '../services/dynamodb';
import { S3Service } from '../services/s3';
import { SESService } from '../services/ses';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseBody,
  logger,
  getUserIdFromEvent,
  isAdmin
} from '../utils/common';
import { CertificationReviewRequest } from '../types';

const certificationService = new CertificationService();
const profileService = new ProfileService();
const skillService = new SkillService();
const s3Service = new S3Service();
const sesService = new SESService();

/**
 * GET /api/admin/certifications
 * Get all pending certifications (admin only)
 */
export const getPendingCertifications = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Check if user is admin
    if (!isAdmin(event)) {
      return createErrorResponse(403, 'Forbidden - Admin access required');
    }

    const certifications = await certificationService.getPendingCertifications();

    // Generate download URLs for PDFs
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
    logger.error('Error getting pending certifications', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * POST /api/admin/certifications/:id/approve
 * Approve a certification (admin only)
 */
export const approveCertification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Check if user is admin
    if (!isAdmin(event)) {
      return createErrorResponse(403, 'Forbidden - Admin access required');
    }

    const adminEmail = event.requestContext.authorizer?.claims?.email || '';
    const certificationId = event.pathParameters?.id;

    if (!certificationId) {
      return createErrorResponse(400, 'Certification ID is required');
    }

    // Get certification
    const certification = await certificationService.getCertification(certificationId);
    if (!certification) {
      return createErrorResponse(404, 'Certification not found');
    }

    if (certification.status !== 'pending') {
      return createErrorResponse(400, 'Certification is not pending');
    }

    // Approve certification
    const updatedCert = await certificationService.approveCertification(certificationId, adminEmail);

    // Update user profile
    const profile = await profileService.getProfile(certification.userId);
    if (profile) {
      const certifiedSkills = profile.certifiedSkills || [];
      if (!certifiedSkills.includes(certification.skillCategory)) {
        certifiedSkills.push(certification.skillCategory);
      }

      await profileService.updateProfile(certification.userId, {
        isCertified: true,
        certifiedSkills,
      });
      
      // Update all user's skills with certified status
      await skillService.updateUserSkillsCertification(certification.userEmail, true);
    }

    // Send approval email
    try {
      await sesService.sendApprovalEmail(
        certification.userEmail,
        certification.userName,
        certification.certificateTitle,
        certification.issuingOrganization
      );
    } catch (emailError) {
      logger.error('Error sending approval email', emailError);
      // Continue even if email fails
    }

    return createSuccessResponse({
      message: 'Certification approved successfully',
      certification: updatedCert,
    });
  } catch (error) {
    logger.error('Error approving certification', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * POST /api/admin/certifications/:id/reject
 * Reject a certification (admin only)
 */
export const rejectCertification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Reject certification called', { certId: event.pathParameters?.id });
    
    // Check if user is admin
    const adminCheck = isAdmin(event);
    logger.info('Admin check result', { isAdmin: adminCheck });
    
    if (!adminCheck) {
      logger.warn('Non-admin user attempted to reject certification');
      return createErrorResponse(403, 'Forbidden - Admin access required');
    }

    const adminEmail = event.requestContext.authorizer?.claims?.email || '';
    const certificationId = event.pathParameters?.id;

    if (!certificationId) {
      logger.error('Certification ID missing');
      return createErrorResponse(400, 'Certification ID is required');
    }

    logger.info('Parsing request body');
    const reviewRequest: CertificationReviewRequest = parseBody(event);
    logger.info('Request body parsed', { hasReason: !!reviewRequest.rejectionReason });

    if (!reviewRequest.rejectionReason || reviewRequest.rejectionReason.trim().length < 10) {
      logger.error('Rejection reason invalid', { reason: reviewRequest.rejectionReason });
      return createErrorResponse(400, 'Rejection reason is required (minimum 10 characters)');
    }

    logger.info('Fetching certification from DB');
    // Get certification
    const certification = await certificationService.getCertification(certificationId);
    if (!certification) {
      return createErrorResponse(404, 'Certification not found');
    }

    if (certification.status !== 'pending') {
      return createErrorResponse(400, 'Certification is not pending');
    }

    // Send rejection email before deleting
    try {
      await sesService.sendRejectionEmail(
        certification.userEmail,
        certification.userName,
        certification.certificateTitle,
        reviewRequest.rejectionReason
      );
    } catch (emailError) {
      logger.error('Error sending rejection email', emailError);
      // Continue even if email fails
    }

    // Delete from S3
    if (certification.documentKey) {
      await s3Service.deleteCertification(certification.documentKey);
    }

    // Delete from DynamoDB
    await certificationService.deleteCertification(certificationId);

    return createSuccessResponse({
      message: 'Certification rejected and deleted',
    });
  } catch (error) {
    logger.error('Error rejecting certification', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
