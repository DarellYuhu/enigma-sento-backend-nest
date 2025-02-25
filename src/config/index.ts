export const config = () => ({
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS.split(','),
  MONGO_URI: process.env.MONGO_URI,
});
