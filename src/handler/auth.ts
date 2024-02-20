import { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';
import { D1QB } from 'workers-qb';
import { challangePassword, createNewSession } from '../lib/auth';
import { getUserFromID } from '../lib/users';

const login = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const body = await c.req.json<loginBody>();

        const user = await getUserFromID(qb, body.id);

        const result = await challangePassword(body.password, user.salt, user.sha256);

        if (result) {
            const sessionId = await createNewSession(c, user);
            return c.json({ ok: true, k: sessionId }, 200);
        } else {
            return c.json({ error: { message: 'Invalid ID or password' } }, 401);
        }
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};

const logout = async (c: Context<ContextArgs>) => {
    const redirect_uri = c.req.query('r');

    if (!redirect_uri) {
        return c.json({ error: { message: 'Bad request' } }, 400);
    }

    deleteCookie(c, 'token', {
        domain: c.env.API_HOST,
        path: '/',
    });

    return c.redirect(redirect_uri);
};

export const auth = {
    login,
    logout,
};
