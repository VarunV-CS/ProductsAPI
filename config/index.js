import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 8000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://vampirevenem_db_user:4ZVplho6FNslMwZA@m1cart.ncp7zzq.mongodb.net/m1Cart?appName=M1Cart',
  JWT_SECRET: process.env.JWT_SECRET || 'm1cart-secret-key-change-in-production-2024',
};

export default config;
