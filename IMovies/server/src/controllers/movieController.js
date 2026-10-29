import { Movie } from '../models/Movie.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/regex.js';

export const getMovies = async (req, res, next) => {
  try {
    const {
      status,
      genre,
      language,
      search,
      sort = '-releaseDate',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (genre && genre !== 'all') {
      query.genres = { $in: [new RegExp(escapeRegex(genre), 'i')] };
    }

    if (language && language !== 'all') {
      query.languages = { $in: [new RegExp(escapeRegex(language), 'i')] };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { title: searchRegex },
        { synopsis: searchRegex },
        { director: searchRegex },
        { genres: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(limitNum),
      Movie.countDocuments(query)
    ]);

    return paginatedResponse(res, movies, { total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let movie = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id });
    }

    if (!movie) {
      return errorResponse(res, 'Movie not found.', 404);
    }

    return successResponse(res, movie);
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const { title, synopsis, posterUrl, backdropUrl, trailerUrl, genres, languages, duration, releaseDate, certification, director, cast, status, rating } = req.body;

    const slug = req.body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existingSlug = await Movie.findOne({ slug });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    const movie = await Movie.create({
      title,
      slug: finalSlug,
      synopsis,
      posterUrl,
      backdropUrl: backdropUrl || '',
      trailerUrl: trailerUrl || '',
      genres: Array.isArray(genres) ? genres : [genres],
      languages: Array.isArray(languages) ? languages : [languages || 'English'],
      duration: Number(duration),
      releaseDate: new Date(releaseDate),
      certification: certification || 'UA',
      director: director || '',
      cast: Array.isArray(cast) ? cast : [],
      status: status || 'now_showing',
      rating: rating ? Number(rating) : 8.5
    });

    return successResponse(res, movie, 'Movie created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      synopsis,
      posterUrl,
      backdropUrl,
      trailerUrl,
      genres,
      languages,
      duration,
      releaseDate,
      certification,
      director,
      cast,
      status,
      rating
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (synopsis !== undefined) updateData.synopsis = synopsis;
    if (posterUrl !== undefined) updateData.posterUrl = posterUrl;
    if (backdropUrl !== undefined) updateData.backdropUrl = backdropUrl;
    if (trailerUrl !== undefined) updateData.trailerUrl = trailerUrl;
    if (genres !== undefined) updateData.genres = Array.isArray(genres) ? genres : [genres];
    if (languages !== undefined) updateData.languages = Array.isArray(languages) ? languages : [languages];
    if (duration !== undefined) updateData.duration = Number(duration);
    if (releaseDate !== undefined) updateData.releaseDate = new Date(releaseDate);
    if (certification !== undefined) updateData.certification = certification;
    if (director !== undefined) updateData.director = director;
    if (cast !== undefined) updateData.cast = Array.isArray(cast) ? cast : [];
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = Number(rating);

    const movie = await Movie.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!movie) {
      return errorResponse(res, 'Movie not found.', 404);
    }

    return successResponse(res, movie, 'Movie updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return errorResponse(res, 'Movie not found.', 404);
    }

    return successResponse(res, null, 'Movie deleted successfully.');
  } catch (error) {
    next(error);
  }
};
