import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnvVar, generateId } from '../utils/common';

const s3Client = new S3Client({ region: getEnvVar('AWS_REGION', 'us-east-1') });

export class S3Service {
  private bucketName = getEnvVar('S3_BUCKET_NAME');

  async generatePresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    expiresIn: number = 3600
  ) {
    const key = this.generateS3Key(userId, filename);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId: userId,
        originalName: filename,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    return {
      uploadUrl,
      key,
      publicUrl: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
    };
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  }

  async getObjectUrl(key: string, isPublic: boolean = false) {
    if (isPublic) {
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } else {
      return await this.generatePresignedDownloadUrl(key);
    }
  }

  private generateS3Key(userId: string, filename: string): string {
    const timestamp = Date.now();
    const fileExtension = filename.split('.').pop();
    const uniqueId = generateId();
    return `pictures/${userId}/${timestamp}_${uniqueId}.${fileExtension}`;
  }

  async createThumbnail(sourceKey: string): Promise<string> {
    // This would typically use AWS Lambda with Sharp or similar image processing library
    // For now, we'll just return the thumbnail key that would be generated
    const parts = sourceKey.split('.');
    const extension = parts.pop();
    const basePath = parts.join('.');
    const thumbnailKey = `${basePath}_thumb.${extension}`;
    
    // TODO: Implement actual thumbnail generation using AWS Lambda + Sharp
    // This would involve:
    // 1. Reading the source image from S3
    // 2. Processing it with Sharp to create a thumbnail
    // 3. Uploading the thumbnail back to S3
    
    return thumbnailKey;
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  parseS3Key(key: string): { userId: string; filename: string } {
    const parts = key.split('/');
    if (parts.length < 3 || parts[0] !== 'pictures') {
      throw new Error('Invalid S3 key format');
    }
    
    return {
      userId: parts[1],
      filename: parts[2],
    };
  }
}