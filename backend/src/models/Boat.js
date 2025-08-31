import mongoose from 'mongoose';

const BoatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    model: { type: String },
    lengthM: { type: Number },
    draftM: { type: Number },
    engine: { type: String },
    notes: { type: String },
    photoUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Boat || mongoose.model('Boat', BoatSchema);
