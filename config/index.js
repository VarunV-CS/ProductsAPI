import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 8000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://vampirevenem_db_user:4ZVplho6FNslMwZA@m1cart.ncp7zzq.mongodb.net/m1Cart?appName=M1Cart',
  JWT_SECRET: process.env.JWT_SECRET || 'm1cart-secret-key-change-in-production-2024',


// Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
};

export default config;
