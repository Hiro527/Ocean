import { Context } from 'hono';
import { D1QB } from 'workers-qb';
import { setCookie } from 'hono/cookie';

export const session = async (c: Context<ContextArgs>) => {
    try {
        const qb = new D1QB(c.env.DB);
        const session_uuid = c.req.query('k');
        const redirect_uri = c.req.query('r');

        if (!session_uuid || !redirect_uri) {
            return c.json({ error: { message: 'Bad request' } }, 400);
        }

        const fetchedSession = await qb
            .fetchOne({
                tableName: 'sessions',
                fields: '*',
                where: {
                    conditions: 'id = ?1',
                    params: [session_uuid],
                },
            })
            .execute();

        const session = fetchedSession.results as Session;

        if (!session) {
            return c.json({ error: { message: 'Bad request' } }, 400);
        }

        const fetchedToken = await qb
            .fetchOne({
                tableName: 'tokens',
                fields: '*',
                where: {
                    conditions: 'token = ?1',
                    params: [session.token],
                },
            })
            .execute();

        const token = fetchedToken.results as Token;

        setCookie(c, 'token', session.token, {
            expires: new Date(token.expire_date),
            domain: c.env.API_HOST,
            path: '/',
        });

        return c.redirect(redirect_uri);
    } catch (e) {
        console.log('error', e);
        return c.json({ error: { message: e } }, 500);
    }
};
