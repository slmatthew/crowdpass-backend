import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = Number(process.env.API_PORT) || 3000;

const allowedOrigins = [
  process.env.AP_BASE_URI,
  process.env.TMA_BASE_URI,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

import vkAuthRoutes from './routes/auth/vk';
import telegramAuthRoutes from './routes/auth/telegram';

import mainInternalRoutes from './routes/internal/main';

import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/user';

app.use('/api/auth/vk', vkAuthRoutes);
app.use('/api/auth/telegram', telegramAuthRoutes);

app.use('/api', adminRoutes);
app.use('/api', userRoutes);

app.use('/api/internal', mainInternalRoutes);

export function startApiServer() {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
  });
}
