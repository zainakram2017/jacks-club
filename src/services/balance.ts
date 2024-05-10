import { Balance } from '../models/balance';

import { dynamoDB } from '../constants/db';

export async function getBalance(userUuid: string): Promise<Balance | null> {
    const params = {
        TableName: 'Balances',
        Key: { userUuid }
    };
    const result = await dynamoDB.get(params).promise();
    return result.Item as Balance;
}

export async function createBalance(balance: Balance): Promise<void> {
    const params = {
        TableName: 'Balances',
        Item: balance,
        ConditionExpression: 'attribute_not_exists(userUuid)'
    };
    await dynamoDB.put(params).promise();
}

export async function updateBalance(userUuid: string, amount: number): Promise<void> {
    const params = {
        TableName: 'Balances',
        Key: { userUuid: userUuid },
        UpdateExpression: 'SET amount = :amount',
        ExpressionAttributeValues: { ':amount': amount }
    };
    await dynamoDB.update(params).promise();
}

