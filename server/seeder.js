const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user.model');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

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

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please provide proper argument: -i (import) or -d (delete)');
  process.exit(1);
}
