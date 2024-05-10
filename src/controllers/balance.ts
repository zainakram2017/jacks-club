import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getBalance, updateBalance } from '../services/balance';
import { Balance } from '../models/balance';

export async function getBalanceHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User ID is required' })
            };
        }
        const balance = await getBalance(userUuid);
        if (!balance) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Balance not found' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(balance)
        };
    } catch (error) {
        console.error('Error getting balance:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}

export async function updateBalanceHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User ID is required' })
            };
        }
        const { amount } = JSON.parse(event.body || '{}');
        if (typeof amount !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Amount must be a number' })
            };
        }
        if (amount < 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Amount cannot be negative' })
            };
        }
        await updateBalance(userUuid, amount);
        console.log('Updated')
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Balance updated successfully' })
        };
    } catch (error) {
        console.error('Error updating balance:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}
