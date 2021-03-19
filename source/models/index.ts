import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { DB_URI } = process.env;

export = mongoose.connect('mongodb+srv://split-user:bananasplit144@bananasplit.9gbut.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
