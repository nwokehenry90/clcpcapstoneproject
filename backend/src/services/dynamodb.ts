import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { getEnvVar, getCurrentTimestamp, generateId } from '../utils/common';

const client = new DynamoDBClient({ region: getEnvVar('AWS_REGION', 'us-east-1') });
const docClient = DynamoDBDocumentClient.from(client);

export class SkillService {
  private tableName = getEnvVar('SKILLS_TABLE_NAME');

  async createSkill(skillData: {
    title: string;
    description: string;
    userName: string;
    userEmail: string;
    category: string;
    location: string;
  }) {
    const timestamp = getCurrentTimestamp();
    const skill = {
      id: generateId(),
      ...skillData,
      isAvailable: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: skill,
    }));

    return skill;
  }

  async getSkill(skillId: string) {
    const result = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id: skillId },
    }));

    return result.Item;
  }

  async updateSkill(skillId: string, updates: Record<string, any>) {
    const timestamp = getCurrentTimestamp();
    
    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.keys(updates).forEach((key, index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = updates[key];
    });

    // Always update the timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = timestamp;

    const result = await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id: skillId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes;
  }

  async deleteSkill(skillId: string) {
    await docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { id: skillId },
    }));
  }

  async getAllSkills(category?: string, limit: number = 50, lastKey?: string) {
    let params: any = {
      TableName: this.tableName,
      Limit: limit,
      ScanIndexForward: false, // Sort by newest first
    };

    if (category && category !== 'all') {
      params.FilterExpression = 'category = :category AND isAvailable = :isAvailable';
      params.ExpressionAttributeValues = {
        ':category': category,
        ':isAvailable': true,
      };
    } else {
      params.FilterExpression = 'isAvailable = :isAvailable';
      params.ExpressionAttributeValues = {
        ':isAvailable': true,
      };
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(lastKey);
    }

    const result = await docClient.send(new ScanCommand(params));
    
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null,
    };
  }

  async searchSkills(searchTerm?: string, category?: string, location?: string) {
    const params: any = {
      TableName: this.tableName,
      FilterExpression: 'isAvailable = :isAvailable',
      ExpressionAttributeValues: {
        ':isAvailable': true,
      },
    };

    const filterParts: string[] = ['isAvailable = :isAvailable'];

    if (searchTerm) {
      filterParts.push('(contains(title, :searchTerm) OR contains(description, :searchTerm) OR contains(userName, :searchTerm))');
      params.ExpressionAttributeValues[':searchTerm'] = searchTerm;
    }

    if (category && category !== 'all') {
      filterParts.push('category = :category');
      params.ExpressionAttributeValues[':category'] = category;
    }

    if (location) {
      filterParts.push('contains(#location, :location)');
      params.ExpressionAttributeNames = { '#location': 'location' };
      params.ExpressionAttributeValues[':location'] = location;
    }

    params.FilterExpression = filterParts.join(' AND ');

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  }
}

