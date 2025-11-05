require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Database connection failed. Server cannot start.');
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('🚀 Server is running!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('\n📋 Available API Endpoints:');
      console.log('   POST /api/auth/register - Register new user');
      console.log('   POST /api/auth/login    - User login');
      console.log('   GET  /api/auth/me       - Get current user (requires auth)');
      console.log('   GET  /api/admin/users   - Get all users (admin only)');
      console.log('   GET  /api/admin/stats   - Get system stats (admin only)');
      console.log('\n🔑 Default Admin User:');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
      console.log('\n💡 To run database migrations: npm run migrate');
      console.log('💡 To start in development mode: npm run dev');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('\nSIGTERM received. Closing server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();