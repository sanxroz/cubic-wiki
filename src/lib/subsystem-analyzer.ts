import { RepositoryFile, GitHubRepository } from "./types";

// Constants
const CONFIDENCE_THRESHOLD = 0.4;
const FILE_COUNT_NORMALIZER = 5;

// Simplified interfaces - production ready
export interface SubsystemInfo {
  name: string;
  type: "frontend" | "backend" | "data" | "config";
  files: string[];
  confidence: number;
  description: string;
}

export interface SubsystemAnalysis {
  subsystems: SubsystemInfo[];
  projectType: string;
}

// Configuration-driven pattern matching
interface PatternRule {
  match: string[];
  weight: number;
}

interface SubsystemConfig {
  name: string;
  type: SubsystemInfo["type"];
  description: string;
  patterns: PatternRule[];
}

// Core subsystem definitions - focused and minimal
const SUBSYSTEM_CONFIGS: Record<string, SubsystemConfig> = {
  frontend: {
    name: "Frontend",
    type: "frontend",
    description: "User interface components and frontend logic",
    patterns: [
      {
        match: [
          "pages/",
          "components/",
          "src/components/",
          "src/pages/",
          "views/",
          "src/views/",
        ],
        weight: 0.8,
      },
      { match: [".jsx", ".tsx", ".vue", ".svelte"], weight: 0.7 },
      { match: ["public/", "static/", "assets/"], weight: 0.6 },
      { match: ["styles/", "css/", "scss/"], weight: 0.5 },
    ],
  },
  backend: {
    name: "Backend",
    type: "backend",
    description: "Server-side logic and business rules",
    patterns: [
      { match: ["server/", "backend/", "api/"], weight: 0.8 },
      { match: ["controllers/", "handlers/", "routes/"], weight: 0.7 },
      { match: ["services/", "business/", "domain/"], weight: 0.6 },
      { match: ["/api/", ".route.", ".endpoint.", ".api."], weight: 0.6 },
    ],
  },
  data: {
    name: "Data Layer",
    type: "data",
    description: "Database models, schemas, and data access logic",
    patterns: [
      { match: ["models/", "database/", "db/", "data/"], weight: 0.8 },
      { match: ["repositories/", "dao/", "orm/"], weight: 0.7 },
      { match: [".model.", ".schema.", ".migration."], weight: 0.6 },
      { match: ["prisma/", "migrations/", "seeds/"], weight: 0.6 },
    ],
  },
  config: {
    name: "Configuration",
    type: "config",
    description: "Configuration files and deployment settings",
    patterns: [
      { match: ["config/", "configuration/"], weight: 0.7 },
      { match: [".config.", ".env", ".json", ".yaml", ".yml"], weight: 0.5 },
      { match: ["docker/", "k8s/", "kubernetes/", "deployment/"], weight: 0.6 },
      { match: ["Dockerfile", "docker-compose"], weight: 0.6 },
    ],
  },
};

/**
 * Main analysis function - simplified and production ready
 */
export function analyzeSubsystems(
  repository: GitHubRepository,
  files: RepositoryFile[]
): SubsystemAnalysis {
  // Input validation
  if (!repository) {
    throw new Error("Repository data is required");
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      subsystems: [],
      projectType: "Unknown Project",
    };
  }

  try {
    const filePaths = files.map((f) => f?.path).filter(Boolean);

    if (filePaths.length === 0) {
      return {
        subsystems: [],
        projectType: "Unknown Project",
      };
    }

    // Single-pass analysis through all configurations
    const detectedSubsystems = Object.values(SUBSYSTEM_CONFIGS)
      .map((config) => detectSubsystem(filePaths, config))
      .filter(
        (subsystem): subsystem is SubsystemInfo =>
          subsystem !== null && subsystem.confidence >= CONFIDENCE_THRESHOLD
      );

    // Remove duplicates, keeping highest confidence
    const uniqueSubsystems = deduplicateSubsystems(detectedSubsystems);

    return {
      subsystems: uniqueSubsystems,
      projectType: determineProjectType(repository, filePaths),
    };
  } catch (error) {
    console.error("Error analyzing subsystems:", error);
    return {
      subsystems: [],
      projectType: "Unknown Project",
    };
  }
}

/**
 * Generic detection engine - eliminates code duplication
 */
function detectSubsystem(
  filePaths: string[],
  config: SubsystemConfig
): SubsystemInfo | null {
  const matchedFiles = new Set<string>();
  let totalScore = 0;

  for (const { match, weight } of config.patterns) {
    const patternMatches = findPatternMatches(filePaths, match);

    if (patternMatches.length > 0) {
      patternMatches.forEach((file) => matchedFiles.add(file));
      // Normalize score by file count to prevent bias toward projects with many files
      const normalizedScore = Math.min(
        patternMatches.length / FILE_COUNT_NORMALIZER,
        1
      );
      totalScore += weight * normalizedScore;
    }
  }

  if (matchedFiles.size === 0) {
    return null;
  }

  return {
    name: config.name,
    type: config.type,
    files: Array.from(matchedFiles),
    confidence: Math.min(totalScore, 1.0),
    description: config.description,
  };
}

/**
 * Efficient pattern matching using string includes instead of regex
 */
function findPatternMatches(filePaths: string[], patterns: string[]): string[] {
  return filePaths.filter((path) =>
    patterns.some((pattern) => path.includes(pattern))
  );
}

/**
 * Remove duplicate subsystems, keeping the one with highest confidence
 */
function deduplicateSubsystems(subsystems: SubsystemInfo[]): SubsystemInfo[] {
  const subsystemMap = new Map<string, SubsystemInfo>();

  for (const subsystem of subsystems) {
    const existing = subsystemMap.get(subsystem.type);
    if (!existing || subsystem.confidence > existing.confidence) {
      subsystemMap.set(subsystem.type, subsystem);
    }
  }

  return Array.from(subsystemMap.values()).sort(
    (a, b) => b.confidence - a.confidence
  );
}

/**
 * Simplified project type detection - focused on common cases
 */
function determineProjectType(
  repository: GitHubRepository,
  filePaths: string[]
): string {
  const language = repository.language?.toLowerCase() || "";

  try {
    // JavaScript/TypeScript ecosystem
    if (filePaths.includes("package.json")) {
      if (filePaths.some((p) => p.includes("next.config"))) {
        return "Next.js Application";
      }
      if (
        filePaths.some((p) => p.includes("components/") || p.includes("pages/"))
      ) {
        return "React Application";
      }
      if (
        filePaths.some((p) => p.includes("server") || p.includes("express"))
      ) {
        return "Node.js Server";
      }
      return "JavaScript/TypeScript Project";
    }

    // Other common project types
    if (filePaths.some((p) => p === "requirements.txt" || p === "setup.py")) {
      return "Python Project";
    }
    if (filePaths.includes("Cargo.toml")) {
      return "Rust Project";
    }
    if (filePaths.includes("go.mod")) {
      return "Go Project";
    }
    if (filePaths.some((p) => p === "pom.xml" || p.includes("build.gradle"))) {
      return "Java Project";
    }

    // Fallback to language or generic
    if (language) {
      return `${language.charAt(0).toUpperCase() + language.slice(1)} Project`;
    }

    return "Software Project";
  } catch (error) {
    console.error("Error determining project type:", error);
    return "Unknown Project";
  }
}
