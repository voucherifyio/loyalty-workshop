/**
 * Recursively flattens a query value into `key`/`key[sub]`/`key[i]` pairs
 * (bracket notation), matching the wire format expected by backends that
 * parse query strings with a `qs`-style parser — nested objects/arrays only
 * become real objects/arrays server-side when sent this way. A plain
 * `JSON.stringify`'d value would instead arrive as an unparsed string.
 * Nullish values are dropped so optional params don't get sent at all.
 */
function appendParam(pairs, key, value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendParam(pairs, `${key}[${i}]`, v));
  } else if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => appendParam(pairs, `${key}[${k}]`, v));
  } else {
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
}

/**
 * Appends a query string to a path when there are parameters to add.
 * Supports nested objects/arrays (serialized as bracket-notation keys) in
 * addition to flat string/number/boolean values.
 * @param {string} path - The base URL path
 * @param {object} query - Key/value query parameters (empty values are omitted)
 * @returns {string}
 */
export function withQuery(path, query = {}) {
  const pairs = [];
  Object.entries(query).forEach(([key, value]) => appendParam(pairs, key, value));
  return pairs.length ? `${path}?${pairs.join('&')}` : path;
}

/**
 * Builds the `filters` query object for the report endpoints'
 * filter grammar: `{ junction, "<dimension_field>": { conditions: { $is: value } } }`.
 * Returned as a plain object (not a JSON string) — `withQuery` serializes it
 * as bracket-notation query params (e.g.
 * `filters[card_definition_id][conditions][$is]=value`), which is what the
 * backend's query parser expects; a JSON-stringified value arrives as an
 * unparsed string and fails schema validation ("Property .filters must be
 * object").
 * Entries with an empty/nullish value are dropped; returns `undefined` when
 * no active filters remain (so callers can spread it straight into a query
 * object without adding an empty `filters` param).
 * @param {Array<{field: string, value: string|null|undefined}>} entries
 * @param {'AND'|'OR'} [junction]
 * @returns {object|undefined}
 */
export function buildFilters(entries, junction = 'AND') {
  const active = entries.filter((e) => e.value != null && e.value !== '');
  if (active.length === 0) return undefined;

  const filters = { junction };
  active.forEach(({ field, value }) => {
    filters[field] = { conditions: { $is: value } };
  });
  return filters;
}
