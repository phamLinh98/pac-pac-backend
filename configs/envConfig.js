import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
    accessSecretKey: process.env.JWT_ACCESS_SECRET,
    refeshSecretKey: process.env.JWT_REFRESH_SECRET
};