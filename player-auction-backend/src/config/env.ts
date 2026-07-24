import dotenv from 'dotenv';

dotenv.config();

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

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveMongoUri(): string {
  const configuredUri = process.env.MONGODB_URI ?? process.env.MONGODB_URL ?? process.env.DATABASE_URL ?? process.env.MONGODB_CONNECTION_STRING;
  if (configuredUri) {
    return configuredUri;
  }

  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST ?? process.env.MONGO_HOST;

  if (username && password && host) {
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    return `mongodb+srv://${encodedUsername}:${encodedPassword}@${host}/player-auction?retryWrites=true&w=majority`;
  }

  throw new Error('Missing required MongoDB connection details. Set MONGODB_URI (or MONGODB_URL, DATABASE_URL, or MONGODB_USERNAME/MONGODB_PASSWORD/MONGODB_HOST).');
}

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: resolveMongoUri(),
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
};
