/**
 * Safe JSON parser to prevent application crashes from Corrupted JSON strings.
 * @param {string} jsonString - The JSON string to parse.
 * @param {any} fallbackValue - The value to return if parsing fails.
 * @returns {any} The parsed object or fallbackValue.
 */
export const safeJsonParse = (jsonString, fallbackValue = null) => {
  if (!jsonString || typeof jsonString !== 'string') return fallbackValue;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("🔥 [safeJsonParse] SyntaxError caught:", error);
    return fallbackValue;
  }
};
