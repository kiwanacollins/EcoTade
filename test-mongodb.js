const { MongoClient } = require('mongodb');

// Connection URI
const uri = process.env.MONGODB_URI || "mongodb://admin:password@localhost:27017/forexproxdb?authSource=admin";

console.log('Testing MongoDB connection with URI:', uri.replace(/\/\/.*:.*@/, '//****:****@')); // Hide credentials in logs

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Check if we can access the database
    const database = client.db('forexproxdb');
    const collections = await database.listCollections().toArray();
    
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });
    console.log('MongoDB server ping result:', result);
    
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

main().catch(console.error);
