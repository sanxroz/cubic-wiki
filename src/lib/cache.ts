import { promises as fs } from "fs";
import path from "path";
import { WikiData } from "./types";

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // keep the values for 24 hours
  dataDir: "data/wikis",
};

/**
 * Gets the cache file path for a given cache key
 */
function getCacheFilePath(cacheKey: string): string {
  const dataDir = path.join(process.cwd(), CACHE_CONFIG.dataDir);
  return path.join(dataDir, `${cacheKey}.json`);
}

/**
 * Reads and validates cached wiki data
 * @param cacheKey - The cache key (encoded URL)
 * @returns WikiData if cache is valid and fresh, null otherwise
 */
export async function getCachedAnalysis(
  cacheKey: string
): Promise<WikiData | null> {
  try {
    const filePath = getCacheFilePath(cacheKey);
    const fileContent = await fs.readFile(filePath, "utf-8");

    let data: WikiData;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("Error parsing cached wiki file:", parseError);
      console.log(
        "Corrupted cache file detected, removing and regenerating..."
      );
      // Delete corrupted file and return null to trigger regeneration
      await fs.unlink(filePath).catch(() => {}); // Ignore errors
      return null;
    }

    // Check if cache is still fresh
    const cacheAge = Date.now() - new Date(data.generatedAt).getTime();

    if (cacheAge < CACHE_CONFIG.maxAge) {
      return data;
    } else {
      // Cache is stale, delete it
      await fs.unlink(filePath).catch(() => {}); // Ignore errors
      return null;
    }
  } catch (error) {
    // File doesn't exist or can't be read
    return null;
  }
}

/**
 * Caches wiki data to disk
 * @param cacheKey - The cache key (encoded URL)
 * @param data - The wiki data to cache
 */
export async function cacheAnalysis(
  cacheKey: string,
  data: WikiData
): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), CACHE_CONFIG.dataDir);

    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = getCacheFilePath(cacheKey);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to cache analysis:", error);
    // Don't throw error - caching failure shouldn't break the flow
  }
}
