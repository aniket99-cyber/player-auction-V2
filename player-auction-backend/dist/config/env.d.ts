interface EnvConfig {
    nodeEnv: string;
    port: number;
    mongodbUri: string;
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    corsOrigin: string;
}
export declare const env: EnvConfig;
export {};
