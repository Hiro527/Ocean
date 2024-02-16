import { Hono } from 'hono';
import { cors } from 'hono/cors';

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
