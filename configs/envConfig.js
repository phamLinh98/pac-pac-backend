import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
    accessSecretKey: process.env.JWT_ACCESS_SECRET,
    refeshSecretKey: process.env.JWT_REFRESH_SECRET
};

if (!envConfig.accessSecretKey || !envConfig.refeshSecretKey) {
    throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET là bắt buộc');
}

if (process.env.NODE_ENV === 'production' && (
    envConfig.accessSecretKey.length < 32 ||
    envConfig.refeshSecretKey.length < 32 ||
    envConfig.accessSecretKey === envConfig.refeshSecretKey
)) {
    throw new Error('JWT secrets production phải khác nhau và dài ít nhất 32 ký tự');
}
