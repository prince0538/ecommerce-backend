import 'dotenv/config';
import './cloudinary';
import app from './app';
import prisma from './prisma';

const port = process.env.PORT || 5001;

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
}

start();