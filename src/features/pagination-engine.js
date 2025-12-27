/**
 * Data Pagination Engine (Feature #21)
 * Implements cursor-based and offset-based pagination
 */

class PaginationEngine {
  /**
   * Paginate array
   */
  static paginate(items, page = 1, pageSize = 10) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      items: items.slice(startIndex, endIndex),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Cursor-based pagination
   */
  static cursorPaginate(items, cursor = null, limit = 10) {
    let startIndex = 0;
    if (cursor) {
      startIndex = items.findIndex((item) => item.id === cursor) + 1;
    }

    const paginatedItems = items.slice(startIndex, startIndex + limit);
    const nextCursor =
      paginatedItems.length === limit
        ? paginatedItems[paginatedItems.length - 1]?.id
        : null;

    return {
      items: paginatedItems,
      nextCursor,
      hasMore: nextCursor !== null,
    };
  }
}

module.exports = PaginationEngine;
