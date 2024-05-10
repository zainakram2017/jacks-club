import { Transaction } from '../models/transaction';
// import { getBalance, updateBalance } from './balance';
import { dynamoDB } from '../constants/db';

export async function processTransaction(transaction: Transaction): Promise<void> {
    const amount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;

    const transactionParams = {
        TransactItems: [
            {
                Put: {
                    TableName: 'Transactions',
                    Item: transaction
                }
            },
            {
                Update: {
                    TableName: 'Balances',
                    Key: { userUuid: transaction.userUuid },
                    UpdateExpression: 'set amount = if_not_exists(amount, :zero) + :amount',
                    ExpressionAttributeValues: {
                        ':amount': amount,
                        ':zero': 0,
                        ':negAmount': -amount
                    },
                    ConditionExpression: 'attribute_exists(userUuid) AND (attribute_not_exists(amount) OR amount >= :negAmount)'
                }
            }
        ]
    };

    try {
        const result = await dynamoDB.transactWrite(transactionParams).promise();
        console.log('Transaction successful:', result);
    } catch (error) {
        console.error('Error processing transaction:', error);
        throw 'Insufficient balance';
    }
}

export async function getTransaction(transactionUuid: string): Promise<Transaction> {
    const params = {
        TableName: 'Transactions',
        Key: { transactionUuid: transactionUuid }
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

