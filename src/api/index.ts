import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.AP_BASE_URI || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

import vkAuthRoutes from './routes/auth/vk';
import telegramAuthRoutes from './routes/auth/telegram';

import mainInternalRoutes from './routes/internal/main';

import { adminRoutes } from './routes/admin';

app.use('/api/auth/vk', vkAuthRoutes);
app.use('/api/auth/telegram', telegramAuthRoutes);

app.use('/api', adminRoutes);

app.use('/api/internal', mainInternalRoutes);

export function startApiServer() {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
  });
}
