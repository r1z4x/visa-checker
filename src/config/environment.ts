import dotenv from 'dotenv';

dotenv.config();

export interface EnvironmentConfig {
  telegram: {
    botToken: string;
    channelId: string;
    rateLimit: number;
    retryAfter: number;
  };
  app: {
    checkInterval: string;
    targetCountry: string;
    targetCities: string[];
    missionCountry: string;
    debug: boolean;
  };
  api: {
    visaApiUrl: string;
    maxRetries: number;
    retryDelayBase: number;
  };
  cache: {
    maxSize: number;
    cleanupInterval: number;
  };
}

function validateEnvironment(): EnvironmentConfig {
  const requiredEnvVars = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  const channelId = process.env.TELEGRAM_CHAT_ID;
  if (!channelId || !/^-?\d+$/.test(channelId)) {
    console.error('Invalid TELEGRAM_CHAT_ID format');
    process.exit(1);
  }

  // Parse cities from comma-separated list
  const cities = process.env.CITIES ? process.env.CITIES.split(',').map(city => city.trim()) : [];

  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN as string,
      channelId,
      rateLimit: Number(process.env.TELEGRAM_RATE_LIMIT_MINUTES) || 15,
      retryAfter: Number(process.env.TELEGRAM_RETRY_AFTER) || 5000,
    },
    app: {
      checkInterval: process.env.CHECK_INTERVAL || '*/5 * * * *',
      targetCountry: process.env.TARGET_COUNTRY || 'Turkiye',
      targetCities: cities,
      missionCountry: process.env.MISSION_COUNTRY || 'Netherlands',
      debug: process.env.DEBUG === 'true',
    },
    api: {
      visaApiUrl: process.env.VISA_API_URL || 'https://api.schengenvisaappointments.com/api/visa-list/?format=json',
      maxRetries: Number(process.env.MAX_RETRIES) || 3,
      retryDelayBase: Number(process.env.RETRY_DELAY_BASE) || 1000,
    },
    cache: {
      maxSize: Number(process.env.MAX_CACHE_SIZE) || 1000,
      cleanupInterval: Number(process.env.CACHE_CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000,
    },
  };
}

export const config = validateEnvironment(); 