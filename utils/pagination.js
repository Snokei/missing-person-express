const DEFAULT_PER_PAGE = 20;

/**
 * Parses pagination params from the request query string.
 *
 * @param {Object} query - req.query object
 * @returns {{ page: number, per_page: number, offset: number }}
 */
const getPaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const per_page = Math.max(
    parseInt(query.per_page, 10) || DEFAULT_PER_PAGE,
    1
  );
  const offset = (page - 1) * per_page;

  return { page, per_page, offset };
};

/**
 * Builds the pagination meta object for API responses.
 *
 * @param {number} total - Total number of records
 * @param {number} page - Current page number
 * @param {number} per_page - Records per page
 * @returns {Object} meta object
 */
const getPaginationMeta = (total, page, per_page) => {
  const total_pages = Math.ceil(total / per_page);

  return {
    total,
    page,
    per_page,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
};

module.exports = {
  DEFAULT_PER_PAGE,
  getPaginationParams,
  getPaginationMeta,
};
