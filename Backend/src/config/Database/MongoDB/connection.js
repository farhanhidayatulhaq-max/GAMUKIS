const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://db_mongo:27017/db_auth_express';

const connectMongoDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000 // Timeout dalam 5 detik jika DB mati
    });
    console.log('✅ [MongoDB] Database connected successfully.');
  } catch (error) {
    console.error('❌ [MongoDB] Connection error:', error.message);
  }
};

module.exports = { mongoose, connectMongoDB };