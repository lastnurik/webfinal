const mongoose = require('mongoose');

let isConnected = false;

async function connectDB(mongoUri) {
  if (isConnected) {
    return;
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = {
  connectDB,
};

