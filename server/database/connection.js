const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Validate MONGO_URI environment variable
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }

    // MongoDB connection string
    const con = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected Successfully with ${con.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
