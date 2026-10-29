import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true
    },
    state: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    },
    amenities: {
      type: [String],
      default: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'Gourmet Food & Beverages', 'Wheelchair Accessible', 'Parking']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

theatreSchema.index({ city: 1, isActive: 1 });

export const Theatre = mongoose.model('Theatre', theatreSchema);
