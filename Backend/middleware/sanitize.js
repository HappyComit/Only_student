/**
 * Input Sanitization Utility — XSS Protection for CampusHive
 * 
 * Strips HTML/script tags and limits string length for all user-submitted content.
 * Applied to every POST/PUT route before data hits the database.
 */

/**
 * Strips all HTML tags from a string to prevent XSS injection.
 * Preserves plain text content while removing <script>, <img onerror>, etc.
 * 
 * @param {string} str - Raw user input
 * @returns {string} - Cleaned plain text
 */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')           // Remove all HTML tags
    .replace(/&lt;/g, '<')             // Decode common HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/javascript:/gi, '')       // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')         // Remove event handlers (onclick=, onerror=, etc.)
    .trim();
}

/**
 * Sanitizes a string: strips HTML and enforces a max character length.
 * 
 * @param {string} str - Raw user input
 * @param {number} maxLength - Maximum allowed characters (default: 500)
 * @returns {string} - Sanitized, length-limited string
 */
function sanitize(str, maxLength = 500) {
  if (typeof str !== 'string') return str;
  return stripHtml(str).substring(0, maxLength);
}

/**
 * Sanitizes an object's string values in bulk.
 * Accepts a map of field names to max lengths.
 * Non-string values and undefined fields are passed through untouched.
 * 
 * @param {Object} obj - Object containing user input fields
 * @param {Object} fieldLimits - Map of { fieldName: maxLength }
 * @returns {Object} - New object with sanitized string values
 * 
 * @example
 *   sanitizeFields(req.body, { title: 100, description: 2000, bio: 300 });
 */
function sanitizeFields(obj, fieldLimits) {
  const result = {};
  for (const [field, maxLen] of Object.entries(fieldLimits)) {
    if (obj[field] !== undefined && obj[field] !== null) {
      result[field] = typeof obj[field] === 'string' 
        ? sanitize(obj[field], maxLen) 
        : obj[field];
    }
  }
  return result;
}

module.exports = { stripHtml, sanitize, sanitizeFields };
