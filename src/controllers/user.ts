// src/controllers/user.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createUser, getUser, updateUser, deleteUser, getUsers } from '../services/user';
import { User } from '../models/user';

export async function createUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userData: User = JSON.parse(event.body || '{}');
        const createdUser = await createUser(userData);
        return {
            statusCode: 200,
            body: JSON.stringify(createdUser),
        };
    } catch (error) {
        console.error('Error creating user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}

export async function getUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User Uuid is required' }),
            };
        }
        const user = await getUser(userUuid);
        if (!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(user),
        };
    } catch (error) {
        console.error('Error getting user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}

export async function updateUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User Uuid is required' }),
            };
        }
        const userData: User = JSON.parse(event.body || '{}');
        userData.userUuid = userUuid;
        const updatedUser = await updateUser(userData);
        if (!updatedUser) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(updatedUser),
        };
    } catch (error) {
        console.error('Error updating user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}

export async function deleteUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userUuid = event.pathParameters?.userUuid;
        if (!userUuid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'User Uuid is required' }),
            };
        }
        const user = await getUser(userUuid);
        if (!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' }),
            };
        }

        await deleteUser(userUuid);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User deleted successfully' }),
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}

export async function getUsersHandler(): Promise<APIGatewayProxyResult> {
    try {
        const users = await getUsers();
        return {
            statusCode: 200,
            body: JSON.stringify(users),
        };
    } catch (error) {
        console.error('Error getting users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}
