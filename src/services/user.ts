
import { v4 as uuidv4 } from 'uuid';

import { User } from '../models/user';
import { createBalance } from './balance';

import { dynamoDB } from '../constants/db';

export async function createUser(user: User): Promise<User> {
    const uuid = uuidv4();
    user.userUuid = uuid;

    const params = {
        TableName: 'Users',
        Item: user
    };

    try {
        await dynamoDB.put(params).promise();
        await createBalance({ userUuid: uuid, amount: 100 });
        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

export async function getUser(userUuid: string): Promise<User | null> {
    const params = {
        TableName: 'Users',
        Key: {
            userUuid: userUuid
        }
    };

    try {
        const result = await dynamoDB.get(params).promise();
        return result.Item as User;
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}

export async function getUsers(): Promise<User[]> {
    const params = {
        TableName: 'Users'
    };

    try {
        const result = await dynamoDB.scan(params).promise();
        return result.Items as User[];
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
}

export async function updateUser(user: User): Promise<User> {
    const params = {
        TableName: 'Users',
        Key: {
            userUuid: user.userUuid
        },
        UpdateExpression: 'set #name = :name, email = :email',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':name': user.name,
            ':email': user.email
        },
        ReturnValues: 'ALL_NEW'
    };

    try {
        await dynamoDB.update(params).promise();
        return user;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

export async function deleteUser(userUuid: string): Promise<void> {
    const params = {
        TableName: 'Users',
        Key: {
            userUuid: userUuid
        }
    };

    try {
        await dynamoDB.delete(params).promise();
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}
