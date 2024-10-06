import cryptoRandomString from 'crypto-random-string';

export const genKey = (length = 12) => {
    return cryptoRandomString({
        length,
        type: 'alphanumeric',
    });
};
