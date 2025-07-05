/**
 * Utility functions for the application
 */

/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.2 KB", "3.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Generate a unique key for tree nodes
 * @param path - Node path
 * @param level - Node level
 * @returns Unique key string
 */
export function generateTreeNodeKey(path: string, level: number): string {
  return `${path}-${level}`;
}

/**
 * Check if a tree node should be auto-expanded based on level
 * @param level - Node level (0-based)
 * @param maxAutoExpandLevel - Maximum level to auto-expand (default: 2)
 * @returns Whether the node should be auto-expanded
 */
export function shouldAutoExpand(level: number, maxAutoExpandLevel: number = 2): boolean {
  return level < maxAutoExpandLevel;
}

/**
 * Generate tree connector characters for visual tree structure
 * @param isLast - Whether this is the last item in its parent
 * @returns Connector string
 */
export function getTreeConnector(isLast: boolean): string {
  return isLast ? "└── " : "├── ";
}

/**
 * Generate prefix for child nodes based on parent state
 * @param currentPrefix - Current node prefix
 * @param isLast - Whether the parent is the last item
 * @returns Child prefix string
 */
export function getChildPrefix(currentPrefix: string, isLast: boolean): string {
  return currentPrefix + (isLast ? "    " : "│   ");
}

/**
 * Debounce function for search input
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if a string matches a search query (case-insensitive)
 * @param text - Text to search in
 * @param query - Search query
 * @returns Whether the text matches the query
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
}
