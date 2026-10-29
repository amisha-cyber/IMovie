import mongoose from 'mongoose';
import { MOVIE_STATUS } from '../utils/constants.js';

const castMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    synopsis: {
      type: String,
      required: [true, 'Synopsis is required']
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster URL is required']
    },
    backdropUrl: {
      type: String,
      default: ''
    },
    trailerUrl: {
      type: String,
      default: ''
    },
    genres: {
      type: [String],
      required: true,
      default: []
    },
    languages: {
      type: [String],
      required: true,
      default: ['English']
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, 'Duration in minutes is required']
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required']
    },
    certification: {
      type: String,
      enum: ['U', 'UA', 'A', 'PG', 'PG-13', 'R'],
      default: 'UA'
    },
    director: {
      type: String,
      default: ''
    },
    cast: {
      type: [castMemberSchema],
      default: []
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.5
    },
    status: {
      type: String,
      enum: Object.values(MOVIE_STATUS),
      default: MOVIE_STATUS.NOW_SHOWING,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Search and filtering indexes
movieSchema.index({ title: 'text', synopsis: 'text', genres: 'text', director: 'text' });
movieSchema.index({ status: 1, releaseDate: -1 });

export const Movie = mongoose.model('Movie', movieSchema);
