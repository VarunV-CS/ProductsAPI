import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 4000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017/m1cart',
};

export default config;