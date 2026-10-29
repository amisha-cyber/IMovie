import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Show } from '../models/Show.js';
import { ShowSeat } from '../models/ShowSeat.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { seatReservationService } from '../services/seatReservationService.js';
import { ROLES, MOVIE_STATUS, SHOW_STATUS, BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { env, isProduction } from '../config/environment.js';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

export const seedDatabase = async ({ reset = true, closeConnection = true } = {}) => {
  try {
    if (isProduction()) {
      if (process.env.ALLOW_PRODUCTION_SEED !== 'true') {
        throw new Error('CRITICAL SECURITY GUARD: Production database seeding is blocked. Set ALLOW_PRODUCTION_SEED=true to override.');
      }
      if (!env.ADMIN_SEED_PASSWORD || env.ADMIN_SEED_PASSWORD.length < 14 || env.ADMIN_SEED_PASSWORD === 'Admin@123456') {
        throw new Error('CRITICAL SECURITY GUARD: Production database seeding requires ADMIN_SEED_PASSWORD of at least 14 characters and non-default value.');
      }
    }

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (reset) {
      logger.info('Clearing old collections for clean seed...');
      await Promise.all([
        User.deleteMany({ email: { $ne: 'admin@imovies.com' } }),
        Movie.deleteMany({}),
        Theatre.deleteMany({}),
        Screen.deleteMany({}),
        Show.deleteMany({}),
        ShowSeat.deleteMany({}),
        Booking.deleteMany({}),
        Payment.deleteMany({}),
        Notification.deleteMany({})
      ]);
    }

    // 1. Seed Users
    logger.info('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, salt);

    let demoUser = null;
    if (!isProduction()) {
      const passwordHash = await bcrypt.hash('User@123456', salt);
      demoUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        phone: '+919876500001',
        role: ROLES.USER,
        accountStatus: 'active',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      });
    }

    await User.findOneAndUpdate(
      { email: env.ADMIN_SEED_EMAIL.toLowerCase() },
      {
        name: env.ADMIN_SEED_NAME,
        email: env.ADMIN_SEED_EMAIL.toLowerCase(),
        passwordHash: adminPasswordHash,
        phone: env.ADMIN_SEED_PHONE,
        role: ROLES.ADMIN,
        accountStatus: 'active',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 2. Seed Movies
    logger.info('Seeding movies...');
    const movies = await Movie.insertMany([
      {
        title: 'Interstellar: Beyond Time',
        slug: 'interstellar-beyond-time',
        synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival as earth faces environmental collapse.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        languages: ['English', 'Hindi'],
        duration: 169,
        releaseDate: new Date('2024-05-15'),
        certification: 'UA',
        director: 'Christopher Nolan',
        rating: 9.2,
        status: MOVIE_STATUS.NOW_SHOWING,
        cast: [
          { name: 'Matthew McConaughey', role: 'Cooper', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
          { name: 'Anne Hathaway', role: 'Brand', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' }
        ]
      },
      {
        title: 'Cyberpunk 2099: Neo Tokyo',
        slug: 'cyberpunk-2099-neo-tokyo',
        synopsis: 'In a neon-soaked dystopian metropolis, a rogue hacker and an android mercenary uncover a conspiracy controlling human memories.',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=qIcTM8WXFjk',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        languages: ['English', 'Japanese'],
        duration: 142,
        releaseDate: new Date('2024-06-10'),
        certification: 'A',
        director: 'Denis Villeneuve',
        rating: 8.8,
        status: MOVIE_STATUS.NOW_SHOWING,
        cast: [
          { name: 'Keanu Reeves', role: 'Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' }
        ]
      },
      {
        title: 'Shadows of the Realm',
        slug: 'shadows-of-the-realm',
        synopsis: 'An epic dark fantasy journey of an exiled knight seeking ancient relics to defeat the immortal Shadow Sovereign.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        genres: ['Fantasy', 'Action', 'Adventure'],
        languages: ['English', 'Hindi', 'Tamil'],
        duration: 156,
        releaseDate: new Date('2024-07-01'),
        certification: 'UA',
        director: 'Peter Jackson',
        rating: 8.6,
        status: MOVIE_STATUS.NOW_SHOWING,
        cast: [
          { name: 'Henry Cavill', role: 'Sir Eldrin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
        ]
      },
      {
        title: 'Quantum Abyss',
        slug: 'quantum-abyss',
        synopsis: 'Deep sea researchers discover a rift into an alternate dimension beneath the Mariana Trench.',
        posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=8Qn_spdM5Zg',
        genres: ['Horror', 'Sci-Fi', 'Mystery'],
        languages: ['English'],
        duration: 125,
        releaseDate: new Date('2025-01-20'),
        certification: 'A',
        director: 'Guillermo del Toro',
        rating: 8.2,
        status: MOVIE_STATUS.COMING_SOON,
        cast: [
          { name: 'Cillian Murphy', role: 'Dr. Arthur Cole', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' }
        ]
      },
      {
        title: 'The Silent Mirage',
        slug: 'the-silent-mirage',
        synopsis: 'A gripping detective thriller set in the arid salt flats of Gujarat, where an unsolved disappearance echoes thirty years later.',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        genres: ['Crime', 'Drama', 'Mystery'],
        languages: ['Hindi', 'English'],
        duration: 138,
        releaseDate: new Date('2025-02-14'),
        certification: 'UA',
        director: 'Anurag Kashyap',
        rating: 8.4,
        status: MOVIE_STATUS.COMING_SOON,
        cast: [
          { name: 'Manoj Bajpayee', role: 'Inspector Rathore', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' }
        ]
      }
    ]);

    // 3. Seed Theatres
    logger.info('Seeding theatres...');
    const theatres = await Theatre.insertMany([
      {
        name: 'IMovies Grand IMAX & Luxe',
        slug: 'imovies-grand-imax-luxe-mumbai',
        description: 'Flagship cinema destination in BKC featuring India\'s largest laser projection screen, plush recliners, and gourmet in-seat dining.',
        address: 'Bandra-Kurla Complex, Bandra East',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        amenities: ['IMAX Laser 4K', 'Dolby Atmos 128 Channel', 'Recliner Loungers', 'In-Seat Butler Service', 'Valet Parking']
      },
      {
        name: 'IMovies Premiere Palladium',
        slug: 'imovies-premiere-palladium-lower-parel',
        description: 'Ultra-luxurious multiplex in Lower Parel boasting Barco 4K laser projection, immersive acoustic geometry, and an artisanal confectionery.',
        address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400013',
        amenities: ['Dolby Atmos', '4K Laser Projection', 'VIP Recliner Section', 'Artisanal Cafe', 'Wheelchair Access']
      },
      {
        name: 'IMovies Infinity Cineplex',
        slug: 'imovies-infinity-cineplex-malad',
        description: 'State-of-the-art suburban entertainment hub featuring 4DX environmental effects and Dolby surround sound in Malad West.',
        address: 'Infiniti Mall, New Link Road, Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400064',
        amenities: ['4DX Motion Seats', 'Dolby Atmos', 'Laser 3D', 'Gaming Arcade', 'Reserved Parking']
      },
      {
        name: 'IMovies Metro Heritage',
        slug: 'imovies-metro-heritage-marine-lines',
        description: 'Historic cinema theatre in South Mumbai modernized with cutting-edge digital projection while preserving art-deco grandeur.',
        address: 'M.G. Road, Dhobi Talao, Marine Lines',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
        amenities: ['4K Digital Projection', 'Dolby Surround 7.1', 'Classic Art-Deco Lounge', 'Wheelchair Accessible']
      },
      {
        name: 'IMovies CineDome Dolby Atmos',
        slug: 'imovies-cinedome-delhi',
        description: 'Premier entertainment complex with immersive curved screens and multi-cuisine artisanal food court.',
        address: 'Select Citywalk Mall, Saket',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110017',
        amenities: ['Dolby Atmos', '4K Laser Projection', 'Barco RGB', 'Gourmet Popcorn Bar', 'Wheelchair Access']
      },
      {
        name: 'IMovies Silicon Pavilion',
        slug: 'imovies-silicon-pavilion-bengaluru',
        description: 'Next-generation tech-driven theatre in the heart of Bengaluru with contactless entry and 4DX auditorium.',
        address: 'Phoenix Marketcity, Whitefield Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560048',
        amenities: ['4DX Motion Seats', 'Dolby Atmos', 'Ultra High Definition', 'Reserved VIP Lounge', 'EV Charging']
      }
    ]);

    // 4. Seed Screens for each Theatre
    logger.info('Seeding screens with seating layouts...');
    const createScreenLayout = (numRows = 6, seatsPerRow = 10) => {
      const rows = [];
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numRows);
      for (let r = 0; r < rowLetters.length; r++) {
        const letter = rowLetters[r];
        const category = r < 2 ? 'SILVER' : r < 5 ? 'GOLD' : 'PLATINUM';
        const priceMultiplier = category === 'SILVER' ? 1.0 : category === 'GOLD' ? 1.3 : 1.8;
        const seats = [];
        for (let s = 1; s <= seatsPerRow; s++) {
          seats.push({
            seatNumber: `${letter}${s}`,
            number: s,
            isAisle: s === 3 || s === seatsPerRow - 2
          });
        }
        rows.push({
          rowLetter: letter,
          category,
          priceMultiplier,
          seats
        });
      }
      return { rows };
    };

    const screens = [];
    for (const theatre of theatres) {
      const s1 = await Screen.create({
        theatre: theatre._id,
        name: 'Audi 1 - Laser Atmos',
        screenType: 'Dolby Atmos',
        totalSeats: 60,
        seatingLayout: createScreenLayout(6, 10)
      });
      const s2 = await Screen.create({
        theatre: theatre._id,
        name: 'Audi 2 - IMAX Experience',
        screenType: 'IMAX',
        totalSeats: 60,
        seatingLayout: createScreenLayout(6, 10)
      });
      screens.push(s1, s2);
    }

    // 5. Seed Shows for Today and Tomorrow
    logger.info('Scheduling shows and generating authoritative seat inventory...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const showTimes = [
      { hours: 10, minutes: 0 },
      { hours: 14, minutes: 30 },
      { hours: 18, minutes: 45 },
      { hours: 22, minutes: 15 }
    ];

    const scheduledShows = [];

    // Schedule shows for active now_showing movies in the screens
    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      for (let i = 0; i < screens.length; i++) {
        const screen = screens[i];
        const movie = movies[i % 3]; // now_showing movies

        for (let t = 0; t < showTimes.length; t++) {
          const st = showTimes[t];
          const startTime = new Date(today);
          startTime.setDate(today.getDate() + dayOffset);
          startTime.setHours(st.hours, st.minutes, 0, 0);

          const endTime = new Date(startTime.getTime() + (movie.duration + 30) * 60 * 1000);

          const basePrice = 220;
          const show = await Show.create({
            movie: movie._id,
            theatre: screen.theatre,
            screen: screen._id,
            startTime,
            endTime,
            basePrice,
            seatPricing: {
              silver: 200,
              gold: 260,
              platinum: 360
            },
            status: SHOW_STATUS.SCHEDULED
          });

          // Generate the full seat inventory for this show
          await seatReservationService.initializeShowSeats(show._id);
          scheduledShows.push(show);
        }
      }
    }

    // 6. Create sample verified confirmed booking for the demo user
    if (!isProduction() && demoUser) {
      logger.info('Creating sample confirmed booking for demo user...');
      const futureShow = scheduledShows.find((s) => new Date(s.startTime).getTime() > Date.now() + 2 * 3600 * 1000);
      if (futureShow) {
        const sampleSeats = ['C4', 'C5'];
        
        const hold = await seatReservationService.holdSeats({
          showId: futureShow._id,
          seatNumbers: sampleSeats,
          user: demoUser
        });

        await seatReservationService.confirmBookingPayment({
          bookingId: hold.bookingId,
          paymentResult: {
            paymentId: 'SIM_PAY_DEMO_SEED_001',
            method: 'card'
          },
          user: demoUser
        });
      }
    }

    logger.info('====================================================');
    logger.info('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    if (!isProduction()) {
      logger.info(`👤 Demo User: john@example.com (Password: User@123456)`);
      logger.info(`👑 Admin User: ${env.ADMIN_SEED_EMAIL} (Password: ${env.ADMIN_SEED_PASSWORD})`);
    } else {
      logger.info(`👑 Admin User: ${env.ADMIN_SEED_EMAIL} (Credentials seeded securely)`);
    }
    logger.info(`🎥 Movies created: ${movies.length}`);
    logger.info(`🏛️ Theatres created: ${theatres.length}`);
    logger.info(`🖥️ Screens created: ${screens.length}`);
    logger.info(`📅 Shows scheduled: ${scheduledShows.length}`);
    logger.info('====================================================');
    if (closeConnection) {
      await disconnectDB();
      process.exit(0);
    }

    return { movies, theatres, screens, shows: scheduledShows };
  } catch (error) {
    logger.error('Seeding failed:', error.stack || error.message);
    if (closeConnection) {
      process.exit(1);
    }
    throw error;
  }
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  seedDatabase().catch((err) => {
    logger.error('Direct seed execution failed:', err);
    process.exit(1);
  });
}
