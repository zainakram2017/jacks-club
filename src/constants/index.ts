import dotenv from 'dotenv';
import { Secret } from '../utils/types/index';

dotenv.config();

const validateEnv = (value: string | undefined, name: string): string => {
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
};


const secrets: Secret = {
    AWS_REGION: validateEnv(process.env.AWS_REGION, 'AWS_REGION'),
    credentials: {
        accessKeyId: validateEnv(process.env.AWS_ACCESS_KEY_ID, 'AWS_ACCESS_KEY_ID'),
        secretAccessKey: validateEnv(process.env.AWS_SECRET_ACCESS, 'AWS_SECRET_ACCESS'),
    },
}

export default secrets;
