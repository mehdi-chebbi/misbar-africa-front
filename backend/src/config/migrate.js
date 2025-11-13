const fs = require('fs');
const path = require('path');
const { execute } = require('./database');

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);

      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      // Split SQL statements by semicolon and execute each one
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          await execute(statement);
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      }

      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };