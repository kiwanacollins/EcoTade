const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('./models'); // Update to use centralized models

// Load env vars
dotenv.config();

// Use Docker MongoDB connection
const MONGODB_URI = "mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin";

// Connect to DB
console.log('Connecting to MongoDB for seeding...');
mongoose.connect(MONGODB_URI);

// Import into DB
const importData = async () => {
  try {
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',  // Will be hashed by the pre-save hook
      role: 'admin'
    });

    await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',  // Will be hashed by the pre-save hook
      role: 'user'
    });

    console.log('Data Imported...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await User.deleteMany();
    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i to import or -d to delete data');
  process.exit();
}
