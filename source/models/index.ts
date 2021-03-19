import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { DB_URI } = process.env;

export = mongoose.connect(`${DB_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
