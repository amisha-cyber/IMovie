import { connectDB, disconnectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Show } from '../models/Show.js';
import { ShowSeat } from '../models/ShowSeat.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';

const checkDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();

    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('\n==================================================');
    console.log('📊 MONGODB ATLAS DATABASE INSPECTION (imovies)');
    console.log('==================================================');

    const counts = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Screen.countDocuments(),
      Show.countDocuments(),
      ShowSeat.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments(),
      Notification.countDocuments()
    ]);

    const summary = [
      { Collection: 'users', Documents: counts[0] },
      { Collection: 'movies', Documents: counts[1] },
      { Collection: 'theatres', Documents: counts[2] },
      { Collection: 'screens', Documents: counts[3] },
      { Collection: 'shows', Documents: counts[4] },
      { Collection: 'showseats', Documents: counts[5] },
      { Collection: 'bookings', Documents: counts[6] },
      { Collection: 'payments', Documents: counts[7] },
      { Collection: 'notifications', Documents: counts[8] }
    ];

    console.table(summary);

    // Show sample admin user
    const admin = await User.findOne({ role: 'admin' }).select('name email role accountStatus');
    console.log('\n👑 Admin User in Database:', admin ? admin.toObject() : 'None');

    // Show sample movies
    const sampleMovies = await Movie.find().limit(3).select('title certification duration rating status');
    console.log('\n🎥 Sample Movies in Database:');
    console.table(sampleMovies.map((m) => ({ Title: m.title, Cert: m.certification, Runtime: `${m.duration}m`, Rating: m.rating, Status: m.status })));

    console.log('\n==================================================');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Failed to inspect database:', error.message);
    process.exit(1);
  }
};

checkDatabase();
