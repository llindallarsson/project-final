import mongoose from 'mongoose';

const TrackingSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Types.ObjectId, ref: 'Trip' },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    points: [{ lat: Number, lng: Number, t: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.TrackingSession ||
  mongoose.model('TrackingSession', TrackingSessionSchema);
