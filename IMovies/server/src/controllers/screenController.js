import { Screen } from '../models/Screen.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getScreensByTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const screens = await Screen.find({ theatre: theatreId }).sort({ name: 1 });
    return successResponse(res, screens);
  } catch (error) {
    next(error);
  }
};

export const getScreenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const screen = await Screen.findById(id).populate('theatre');
    if (!screen) {
      return errorResponse(res, 'Screen not found.', 404);
    }
    return successResponse(res, screen);
  } catch (error) {
    next(error);
  }
};

export const createScreen = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const { name, screenType, seatingLayout } = req.body;

    // Calculate total seats from layout
    let totalSeats = 0;
    if (seatingLayout && Array.isArray(seatingLayout.rows)) {
      for (const row of seatingLayout.rows) {
        totalSeats += (row.seats || []).length;
      }
    }

    if (totalSeats === 0) {
      // Default standard layout if empty: 6 rows (A to F) x 10 seats = 60 seats
      const rows = [];
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (let r = 0; r < rowLetters.length; r++) {
        const letter = rowLetters[r];
        const category = r < 2 ? 'SILVER' : r < 5 ? 'GOLD' : 'PLATINUM';
        const multiplier = category === 'SILVER' ? 1.0 : category === 'GOLD' ? 1.3 : 1.8;
        const seats = [];
        for (let s = 1; s <= 10; s++) {
          seats.push({
            seatNumber: `${letter}${s}`,
            number: s,
            isAisle: s === 3 || s === 7
          });
        }
        rows.push({
          rowLetter: letter,
          category,
          priceMultiplier: multiplier,
          seats
        });
      }
      seatingLayout.rows = rows;
      totalSeats = 60;
    }

    const screen = await Screen.create({
      theatre: theatreId,
      name,
      screenType: screenType || 'Dolby Atmos',
      totalSeats,
      seatingLayout
    });

    return successResponse(res, screen, 'Screen created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateScreen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, screenType, seatingLayout, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (screenType) updateData.screenType = screenType;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (seatingLayout && Array.isArray(seatingLayout.rows)) {
      updateData.seatingLayout = seatingLayout;
      let total = 0;
      for (const row of seatingLayout.rows) {
        total += (row.seats || []).length;
      }
      updateData.totalSeats = total;
    }

    const screen = await Screen.findByIdAndUpdate(id, updateData, { new: true });
    if (!screen) {
      return errorResponse(res, 'Screen not found.', 404);
    }
    return successResponse(res, screen, 'Screen updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteScreen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const screen = await Screen.findByIdAndDelete(id);
    if (!screen) {
      return errorResponse(res, 'Screen not found.', 404);
    }
    return successResponse(res, null, 'Screen deleted successfully.');
  } catch (error) {
    next(error);
  }
};
