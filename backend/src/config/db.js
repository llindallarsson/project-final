import mongoose from 'mongoose';

function connectDB(uri) {
  if (!uri) {
    console.error('Missing MONGO_URL');
    process.exit(1);
  }
  return mongoose
    .connect(uri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('Mongo error', err);
      process.exit(1);
    });
}

export { connectDB };
