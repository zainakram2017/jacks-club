import { DynamoDB } from 'aws-sdk';

import { Transaction } from '../models/transaction';
import { getBalance, updateBalance } from './balance';
import secrets from '../constants';

const dynamoDB = new DynamoDB.DocumentClient({
    region: secrets.AWS_REGION,
    accessKeyId: secrets.credentials.accessKeyId,
    secretAccessKey: secrets.credentials.secretAccessKey
});

export async function processTransaction(transaction: Transaction): Promise<void> {
    const amount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
    const lockKey = `balance-lock-${transaction.userUuid}`;
    console.log('Trying to acquire lock:', lockKey);

    try {
        const lockParams = {
            TableName: 'Locks',
            Item: {
                lockKey,
                expirationTime: Math.floor(Date.now() / 1000) + 60 // Lock expires in 60 seconds
            },
            ConditionExpression: 'attribute_not_exists(lockKey)'
        };
        await dynamoDB.put(lockParams).promise(); // Try to acquire the lock
        console.log('Lock acquired:', lockKey);

        // Proceed with the transaction only if the lock is acquired
        const transactionParams = {
            TableName: 'Transactions',
            Item: transaction,
            ConditionExpression: 'attribute_not_exists(idempotentKey)'
        };
        await dynamoDB.put(transactionParams).promise();
        console.log('Transaction recorded:', transaction.idempotentKey);

        const balance = await getBalance(transaction.userUuid);
        console.log('Current balance:', balance?.amount);

        if (balance && (balance.amount + amount < 0)) {
            throw new Error('Insufficient balance');
        } else if (balance) {
            await updateBalance(transaction.userUuid, amount + balance.amount);
            console.log('Balance updated for user:', transaction.userUuid);
        }

    } catch (error) {
        if (error === 'ConditionalCheckFailedException') {
            console.error('Lock acquisition failed:', lockKey);
        } else {
            console.error('Error processing transaction:', error);
        }
        throw error; // Rethrow the error to handle it accordingly (e.g., retry, log)
    } finally {
        // Always attempt to release the lock, regardless of whether the above operations succeed
        const releaseParams = {
            TableName: 'Locks',
            Key: { lockKey }
        };
        await dynamoDB.delete(releaseParams).promise();
        console.log('Lock released:', lockKey);
    }
}

export async function getTransaction(transactionUuid: string): Promise<Transaction> {
    const params = {
        TableName: 'Transactions',
        Key: { transactionUuid: transactionUuid, }
    };
    const result = await dynamoDB.get(params).promise();
    return result.Item as Transaction;
}

export async function getAllTransactions(): Promise<Transaction[]> {
    const params = {
        TableName: 'Transactions'
    };
    const result = await dynamoDB.scan(params).promise();
    return result.Items as Transaction[];
}
