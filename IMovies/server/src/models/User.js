import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active'
    },
    tokenVersion: {
      type: Number,
      default: 0
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetTokenHash: {
      type: String,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    emailVerificationTokenHash: {
      type: String,
      default: null
    },
    emailVerificationOtpHash: {
      type: String,
      default: null
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      index: true
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0
    },
    emailVerificationLockedUntil: {
      type: Date,
      default: null
    },
    emailVerificationLastSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe representation without sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpiresAt;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationOtpHash;
  delete obj.emailVerificationLockedUntil;
  return obj;
};

export const User = mongoose.model('User', userSchema);
