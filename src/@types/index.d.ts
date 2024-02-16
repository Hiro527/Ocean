type Env = {
    DB: D1Database;
    ENV: 'dev' | 'prod';
    DOMAIN: string;
};

type ContextArgs = {
    Bindings: Env;
};
