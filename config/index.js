import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 4000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://admin:34tD1zgy4Mgf8C60@cluster0.xxxxx.mongodb.net/M1cart?retryWrites=true&w=majority',
};

export default config;