export const getPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  };
};

export const buildPaginationQuery = (baseQuery, page, limit, orderBy) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  const paginatedQuery = `${baseQuery} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) as subquery`;

  return { paginatedQuery, countQuery, limitNum, offset };
};