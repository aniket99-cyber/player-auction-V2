import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  corsOrigin: boolean | string[];
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
}

function resolveCloudinaryConfig(): EnvConfig['cloudinary'] {
  const explicitCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const explicitApiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const explicitApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)(?:[/?#]|$)/i);
    if (match) {
      return {
        cloudName: decodeURIComponent(match[3]),
        apiKey: decodeURIComponent(match[1]),
        apiSecret: decodeURIComponent(match[2]),
      };
    }
  }

  return {
    cloudName: explicitCloudName ?? '',
    apiKey: explicitApiKey ?? '',
    apiSecret: explicitApiSecret ?? '',
  };
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
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '30d',
  },
  cloudinary: resolveCloudinaryConfig(),
  corsOrigin: (() => {
    const raw = process.env.CORS_ORIGIN?.trim();
    if (!raw || raw === '*') {
      return true;
    }

    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  })(),
};
