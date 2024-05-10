import { Transaction } from '../models/transaction';
import { getBalance, updateBalance } from './balance';

import { dynamoDB } from '../constants/db';

export async function processTransaction(transaction: Transaction): Promise<void> {
    const amount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
    const lockKey = `balance-lock-${transaction.userUuid}`;

    try {
        const lockParams = {
            TableName: 'Locks',
            Item: {
                lockKey,
                expirationTime: Math.floor(Date.now() / 1000) + 60
            },
            ConditionExpression: 'attribute_not_exists(lockKey)'
        };
        await dynamoDB.put(lockParams).promise();

        const transactionParams = {
            TableName: 'Transactions',
            Item: transaction
        };
        
        const balance = await getBalance(transaction.userUuid);
        
        if (balance && (balance.amount + amount < 0)) {
            throw 'Insufficient balance';
        } else if (balance) {
            await dynamoDB.put(transactionParams).promise();
            await updateBalance(transaction.userUuid, amount + balance.amount);
        }
        
    } catch (error) {
        if (error === 'ConditionalCheckFailedException') {
            console.error('Lock acquisition failed:', lockKey);
        } else {
            console.error('Error processing transaction:', error);
        }
        throw error;
    } finally {
        const releaseParams = {
            TableName: 'Locks',
            Key: { lockKey }
        };
        await dynamoDB.delete(releaseParams).promise();
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

export async function getTransactionByUserUuidAndIdempotentKey(userUuid: string, idempotentKey: string): Promise<Transaction> {
    const params = {
        TableName: 'Transactions',
        FilterExpression: 'userUuid = :userUuid AND idempotentKey = :idempotentKey',
        ExpressionAttributeValues: {
            ':userUuid': userUuid,
            ':idempotentKey': idempotentKey
        }
    };
    const result = await dynamoDB.scan(params).promise();
    return result.Items?.[0] as Transaction;
}

