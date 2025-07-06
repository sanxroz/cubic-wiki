import { neon } from "@neondatabase/serverless";
import { WikiData } from "./types";

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // keep the values for 24 hours
};

/**
 * Get database connection
 */
function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(databaseUrl);
}

/**
 * Initialize cache table if it doesn't exist
 */
async function initializeCacheTable() {
  try {
    const sql = getDatabase();
    await sql`
      CREATE TABLE IF NOT EXISTS cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(500) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `;

    // Create indexes if they don't exist
    await sql`CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cache_key)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)`;
  } catch (error) {
    console.error("Failed to initialize cache table:", error);
    // Don't throw error - table might already exist
  }
}

/**
 * Clean up expired cache entries
 */
async function cleanupExpiredEntries() {
  try {
    const sql = getDatabase();
    await sql`DELETE FROM cache WHERE expires_at < NOW()`;
  } catch (error) {
    console.error("Failed to cleanup expired cache entries:", error);
    // Don't throw error - cleanup failure shouldn't break the flow
  }
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
    await initializeCacheTable();

    const sql = getDatabase();

    // Clean up expired entries periodically (10% chance)
    if (Math.random() < 0.1) {
      await cleanupExpiredEntries();
    }

    const result = await sql`
      SELECT data, created_at, expires_at 
      FROM cache 
      WHERE cache_key = ${cacheKey} AND expires_at > NOW()
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const cachedData = result[0];

    try {
      // Parse the JSONB data back to WikiData object
      const data: WikiData = cachedData.data as WikiData;

      // Ensure the data has the required structure
      if (!data.githubUrl || !data.generatedAt || !data.repository) {
        console.error("Invalid cached data structure");
        return null;
      }

      return data;
    } catch (parseError) {
      console.error("Error parsing cached data:", parseError);
      // Delete corrupted entry
      await sql`DELETE FROM cache WHERE cache_key = ${cacheKey}`;
      return null;
    }
  } catch (error) {
    console.error("Failed to get cached analysis:", error);
    return null;
  }
}

/**
 * Caches wiki data to database
 * @param cacheKey - The cache key (encoded URL)
 * @param data - The wiki data to cache
 */
export async function cacheAnalysis(
  cacheKey: string,
  data: WikiData
): Promise<void> {
  try {
    await initializeCacheTable();

    const sql = getDatabase();
    const expiresAt = new Date(Date.now() + CACHE_CONFIG.maxAge);

    // Use INSERT ... ON CONFLICT to handle duplicate keys
    await sql`
      INSERT INTO cache (cache_key, data, expires_at)
      VALUES (${cacheKey}, ${JSON.stringify(data)}, ${expiresAt})
      ON CONFLICT (cache_key) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        created_at = NOW(),
        expires_at = EXCLUDED.expires_at
    `;
  } catch (error) {
    console.error("Failed to cache analysis:", error);
    // Don't throw error - caching failure shouldn't break the flow
  }
}

/**
 * Get recent analyses from cache
 * @returns Array of recent analysis data
 */
export async function getRecentAnalyses(): Promise<
  { key: string; repo: string; createdAt: string }[]
> {
  try {
    await initializeCacheTable();

    const sql = getDatabase();

    const result = await sql`
      SELECT cache_key, data, created_at
      FROM cache
      WHERE expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 3
    `;

    return result.map((row) => ({
      key: row.cache_key,
      repo: (row.data as WikiData).repository.name,
      createdAt: new Date(row.created_at).toLocaleDateString(),
    }));
  } catch (error) {
    console.error("Failed to get recent analyses:", error);
    return [];
  }
}

/**
 * Delete a cached analysis by cache key
 * @param cacheKey - The cache key to delete
 * @returns Promise<boolean> - true if deleted successfully, false otherwise
 */
export async function deleteCachedAnalysis(cacheKey: string): Promise<boolean> {
  try {
    await initializeCacheTable();

    const sql = getDatabase();

    await sql`
      DELETE FROM cache
      WHERE cache_key = ${cacheKey}
    `;

    // If no error was thrown, consider it successful
    return true;
  } catch (error) {
    console.error("Failed to delete cached analysis:", error);
    return false;
  }
}
