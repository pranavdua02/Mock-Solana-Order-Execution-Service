process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DOTENV_CONFIG_QUIET = 'true';
jest.setTimeout(30_000);

