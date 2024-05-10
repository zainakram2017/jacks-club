import { DynamoDB } from 'aws-sdk';
import secrets from '../constants/index';

export const dynamoDB = new DynamoDB.DocumentClient({
    region: secrets.AWS_REGION,
    accessKeyId: secrets.credentials.accessKeyId,
    secretAccessKey: secrets.credentials.secretAccessKey
});



