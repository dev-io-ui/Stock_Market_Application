const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
   
    const conn = await mongoose.connect("mongodb+srv://akashpuranik06:root@cluster0.ti10o.mongodb.net/stackM");

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

console.log(mongoose.models);
module.exports = connectDB;
