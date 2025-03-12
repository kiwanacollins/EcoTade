/**
 * MongoDB initialization script
 * This will run when the MongoDB container starts for the first time
 */

// Connect to admin database to create users
db = db.getSiblingDB('admin');

// Create application database if it doesn't exist
db = db.getSiblingDB('forexproxdb');

// Create collections
db.createCollection('users');
db.createCollection('transactions');
db.createCollection('settings');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ name: 1 });
db.transactions.createIndex({ userId: 1 });
db.transactions.createIndex({ createdAt: 1 });

print('MongoDB initialization completed successfully');
