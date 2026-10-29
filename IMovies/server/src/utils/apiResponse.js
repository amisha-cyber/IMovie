export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null, extra = null) => {
  const extraFields = typeof extra === 'string' ? { code: extra } : (extra && typeof extra === 'object' ? extra : {});
  return res.status(statusCode).json({
    success: false,
    message,
    ...extraFields,
    ...(errors ? { errors } : {})
  });
};

export const paginatedResponse = (res, data, pagination, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};
