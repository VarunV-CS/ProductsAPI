import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 8000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://admin:34tD1zgy4Mgf8C60@cluster0.xxxxx.mongodb.net/M1cart?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'm1cart-secret-key-change-in-production-2024',
};

export default config;
