export declare const config: {
    env: string;
    port: number;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: string[];
    };
    upload: {
        path: string;
        maxFileSize: number;
    };
    email: {
        host: string | undefined;
        port: number;
        secure: boolean;
        user: string | undefined;
        pass: string | undefined;
        from: string | undefined;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    log: {
        level: string;
    };
};
