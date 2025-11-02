import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse, corsHeaders } from '../utils/common';

export const healthCheck = async (): Promise<APIGatewayProxyResult> => {
  return createSuccessResponse({
    message: 'Cloud Native App API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
};

export const corsHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
};