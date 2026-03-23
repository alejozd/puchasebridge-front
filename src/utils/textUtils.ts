/**
 * Fixes text encoding issues, such as converting "ValidaciÃ³n" back to "Validación".
 * Uses a combination of escape and decodeURIComponent to normalize UTF-8 strings.
 *
 * @param text The string to normalize.
 * @returns The normalized string or the original if an error occurs.
 */
export function fixEncoding(text: string): string {
    if (!text) return "";
    try {
        // Common trick to fix double-encoded UTF-8 strings in JS
        return decodeURIComponent(escape(text));
    } catch {
        return text;
    }
}
