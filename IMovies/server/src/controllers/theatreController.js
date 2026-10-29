import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/regex.js';

export const getTheatres = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const query = { isActive: true };

    if (city && city !== 'all') {
      query.city = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');
    }
    if (search && search.trim()) {
      query.name = new RegExp(escapeRegex(search.trim()), 'i');
    }

    const rawTheatres = await Theatre.find(query).sort({ name: 1 }).lean();
    const theatreIds = rawTheatres.map((t) => t._id);

    // Fetch screens associated with these theatres
    const screens = await Screen.find({ theatre: { $in: theatreIds }, isActive: true })
      .select('theatre name screenType totalSeats')
      .lean();

    const screensByTheatre = {};
    for (const screen of screens) {
      const tId = screen.theatre.toString();
      if (!screensByTheatre[tId]) screensByTheatre[tId] = [];
      screensByTheatre[tId].push(screen);
    }

    const theatresWithScreens = rawTheatres.map((t) => ({
      ...t,
      screens: screensByTheatre[t._id.toString()] || [],
      screenCount: (screensByTheatre[t._id.toString()] || []).length
    }));

    return successResponse(res, theatresWithScreens);
  } catch (error) {
    next(error);
  }
};

export const getTheatreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let theatre = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      theatre = await Theatre.findById(id);
    }
    if (!theatre) {
      theatre = await Theatre.findOne({ slug: id });
    }

    if (!theatre) {
      return errorResponse(res, 'Theatre not found.', 404);
    }

    const screens = await Screen.find({ theatre: theatre._id, isActive: true });

    return successResponse(res, {
      ...theatre.toObject(),
      screens
    });
  } catch (error) {
    next(error);
  }
};

export const createTheatre = async (req, res, next) => {
  try {
    const { name, description, address, city, state, postalCode, country, amenities } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

    const theatre = await Theatre.create({
      name,
      slug,
      description,
      address,
      city,
      state: state || '',
      postalCode: postalCode || '',
      country: country || 'India',
      amenities: amenities || ['Dolby Atmos', '4K Projection', 'Recliners', 'Cafeteria', 'Parking']
    });

    return successResponse(res, theatre, 'Theatre created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, address, city, state, postalCode, country, amenities, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country !== undefined) updateData.country = country;
    if (amenities !== undefined) updateData.amenities = Array.isArray(amenities) ? amenities : [amenities];
    if (isActive !== undefined) updateData.isActive = isActive;

    const theatre = await Theatre.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!theatre) {
      return errorResponse(res, 'Theatre not found.', 404);
    }
    return successResponse(res, theatre, 'Theatre updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findByIdAndDelete(id);
    if (!theatre) {
      return errorResponse(res, 'Theatre not found.', 404);
    }
    await Screen.deleteMany({ theatre: id });
    return successResponse(res, null, 'Theatre and its screens deleted successfully.');
  } catch (error) {
    next(error);
  }
};
