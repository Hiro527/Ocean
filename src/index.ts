import { Context, Hono, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { D1QB } from 'workers-qb';
import { challangeToken } from './lib/auth';

const app = new Hono<ContextArgs>();

app.use(
    '/*',
    cors({
        origin: 'http://localhost:3000',
        allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'],
        allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT'],
        exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
        maxAge: 600,
        credentials: true,
    }),
);

export default {
    fetch: app.fetch,
};
