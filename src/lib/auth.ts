import { Context } from 'hono';
import { D1QB } from 'workers-qb';
import { getCookie } from 'hono/cookie';
import { v4 } from 'uuid';

import { TOKEN_LENGTH } from './consts';

export const generateSaltHash = async (str: string) => {
    const saltArray = new Uint8Array(16);
    const salt = String.fromCharCode(...crypto.getRandomValues(saltArray));
    const strUint8 = new TextEncoder().encode(str + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', strUint8);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((v) => {
            return v.toString(16).padStart(2, '0');
        })
        .join('');
    return { salt, hashHex };
};

export const challangePassword = async (password: string, salt: string, hash: string) => {
    const strUint8 = new TextEncoder().encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', strUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((v) => {
            return v.toString(16).padStart(2, '0');
        })
        .join('');

    return hashHex === hash;
};

export const createNewSession = async (c: Context<ContextArgs>, auth: Auth) => {
    const qb = new D1QB(c.env.DB);

    const arr = new Uint8Array(32);
    const token = btoa(String.fromCharCode(...crypto.getRandomValues(arr))).slice(0, TOKEN_LENGTH);
    const expire_date = Math.floor(new Date().getTime() + 3600 * 24 * 30 * 1e3);

    await qb
        .insert({
            tableName: 'tokens',
            data: {
                token: token,
                user_uuid: auth.uid,
                expire_date: expire_date,
            },
        })
        .execute();

    const session_uuid = v4();

    const session_expire_date = Math.floor(new Date().getTime() / 1e3 + 60);

    await qb
        .insert({
            tableName: 'sessions',
            data: {
                id: session_uuid,
                token: token,
                expire_date: session_expire_date,
            },
        })
        .execute();

    return session_uuid;
};

export const authUserByToken = async (c: Context<ContextArgs>) => {
    const qb = new D1QB(c.env.DB);
    const token = getCookie(c, 'token');

    if (!token) {
        return false;
    }

    const user = await challangeToken(qb, token);

    if (!user) {
        return false;
    }

    return user;
};

export const challangeToken = async (qb: D1QB, tokenToChallange: string) => {
    const fetchedToken = await qb
        .fetchOne({
            tableName: 'tokens',
            fields: '*',
            where: {
                conditions: 'token = ?1',
                params: [tokenToChallange],
            },
        })
        .execute();

    const token = fetchedToken.results as Token;

    if (!token) {
        return null;
    }

    const uid = token.uid;

    const isExpired = new Date().getTime() > token.expire_date;

    if (isExpired) {
        return null;
    }

    const fetchedUser = await qb
        .fetchOne({
            tableName: 'users',
            fields: '*',
            where: {
                conditions: 'uid = ?1',
                params: [uid],
            },
        })
        .execute();

    const user = fetchedUser.results as User;
    return user;
};
