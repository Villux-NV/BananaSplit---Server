import mongoose from 'mongoose';

const { DB_URI } = process.env;

export = mongoose.connect(`${DB_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
