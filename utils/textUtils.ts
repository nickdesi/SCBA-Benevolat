/**
 * Splits a string containing multiple names separated by common separators.
 * Separators: " et ", " & ", " + ", ",", ";"
 * Example: "Thierry et Christelle" -> ["Thierry", "Christelle"]
 */
export const parseNames = (input: string): string[] => {
    if (!input) return [];
    // Regex splits on: 
    // - " et " (surrounded by spaces, case insensitive)
    // - " & " or "&" (surrounded by optional spaces)
    // - " + " or "+" 
    // - "," or ";"
    return input
        .split(/\s+et\s+|[&+,;]/i)
        .map(name => name.trim())
        .filter(name => name.length > 0);
};
