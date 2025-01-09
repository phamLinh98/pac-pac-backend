import jwt from 'jsonwebtoken';

export const signAccessToken = (userLogin, secretKey, options) => {
    return jwt.sign(userLogin, secretKey, options);
}

export const signRefeshToken = (userLogin, secretKey, options) => {
    return jwt.sign(userLogin, secretKey, options);
}