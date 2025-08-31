import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    location: { lat: Number, lng: Number },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
