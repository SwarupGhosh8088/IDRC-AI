import { app } from './app.js';
import { connectDB } from './src/config/database.js';
import { env } from './src/config/env.js';

const startServer = async () => {
  await connectDB();

  const PORT = env.PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
