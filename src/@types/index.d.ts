type Env = {
    DB: D1Database;
    ENV: 'dev' | 'prod';
    API_HOST: string;
    WEB_HOST: string;
};

type ContextArgs = {
    Bindings: Env;
};
