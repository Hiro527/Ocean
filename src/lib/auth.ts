import { Context } from 'hono';
import { D1QB } from 'workers-qb';
import { getCookie } from 'hono/cookie';

export const authUserByToken = async (c: Context<ContextArgs>) => {
    const qb = new D1QB(c.env.DB);
    const token = getCookie(c, 'board_token');

    if (!token) {
        return [
            {
                error: {
                    message: 'Login required',
                },
            },
            401,
        ];
    }

    const user = await challangeToken(qb, token);

    if (!user) {
        return [
            {
                error: {
                    message: 'Token invalid or expired',
                },
            },
            401,
        ];
    }

    return user;
};

export const generateSaltHash = async (str: string) => {
    const saltArray = new Uint8Array(16);
    const salt = String.fromCharCode(...crypto.getRandomValues(saltArray));
    const strUint8 = new TextEncoder().encode(str + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', strUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((v) => {
            return v.toString(16).padStart(2, '0');
        })
        .join('');
    return { salt, hashHex };
};

export const challangePassword = async (challenger: string, salt: string, hash: string) => {
    const strUint8 = new TextEncoder().encode(challenger + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', strUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((v) => {
            return v.toString(16).padStart(2, '0');
        })
        .join('');

    if (hashHex === hash) {
        return 1;
    }
    return 0;
};

export const challangeToken = async (qb: D1QB, token: string) => {
    const fethedTokenInfo = await qb
        .fetchOne({
            tableName: 'tokens',
            fields: '*',
            where: {
                conditions: 'token = ?1',
                params: [token],
            },
        })
        .execute();

    if (!fethedTokenInfo.results) {
        return 0;
    }

    const user_uuid = fethedTokenInfo.results.user_uuid;

    const expired = new Date().getTime() > fethedTokenInfo.expire_date * 1e3;

    if (expired) {
        return 0;
    }

    const fetchedUser = await qb
        .fetchOne({
            tableName: 'users',
            fields: '*',
            where: {
                conditions: 'uuid = ?1',
                params: [user_uuid],
            },
        })
        .execute();

    const user = fetchedUser.results as User;
    return user;
};
