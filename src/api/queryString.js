/**
 * Appends a query string to a path when there are parameters to add.
 * @param {string} path - The base URL path
 * @param {object} query - Key/value query parameters (empty values are omitted)
 * @returns {string}
 */
export function withQuery(path, query = {}) {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
