import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getBalance, updateBalance } from '../services/balance';
import { getUser } from '../services/user';

export async function getBalanceHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const { userUuid } = JSON.parse(event.body || '{}');
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User UUID is required' })
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
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error })
        };
    }
}

export async function updateBalanceHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User UUID is required' })
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
        const user = await getUser(userUuid);
        if (!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User does not exist' })
            };
        }
        await updateBalance(userUuid, amount);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Balance updated successfully' })
        };
    } catch (error) {
        console.error('Error updating balance:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error })
        };
    }
}
