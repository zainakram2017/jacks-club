import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

import { processTransaction, getTransaction, getAllTransactions, getTransactionByUserUuidAndIdempotentKey } from '../services/transaction';
import { Transaction } from '../models/transaction';
import { getUser } from '../services/user';

export async function processTransactionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const { idempotentKey, userUuid, amount, type } = JSON.parse(event.body || '{}');
        if (!idempotentKey || !userUuid || !amount || !type) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters' })
            };
        }
        const user = await getUser(userUuid);
        if(!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' })
            };
        }
        const existingTransaction = await getTransactionByUserUuidAndIdempotentKey(userUuid, idempotentKey);
        if(existingTransaction) {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Transaction already exists' })
            };
        }
        const transaction: Transaction = { transactionUuid: uuidv4(), idempotentKey, userUuid, amount: parseFloat(amount), type };
        await processTransaction(transaction);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Transaction processed successfully' })
        };
    } catch (error) {
        console.error('Error processing transaction:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error })
        };
    }
}

export async function getTransactionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const transactionUuid = event.pathParameters?.transactionUuid;
        if (!transactionUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters' })
            };
        }
        const transaction = await getTransaction(transactionUuid);
        if(!transaction) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Transaction not found' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(transaction)
        };
    }
    catch (error) {
        console.error('Error getting transaction:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error })
        };
    }
}

export async function getAllTransactionsHandler(): Promise<APIGatewayProxyResult> {
    try {
        const transactions = await getAllTransactions();
        return {
            statusCode: 200,
            body: JSON.stringify(transactions)
        };
    }
    catch (error) {
        console.error('Error getting transactions:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error })
        };
    }
}
