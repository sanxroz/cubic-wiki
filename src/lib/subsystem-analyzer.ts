import { RepositoryFile, GitHubRepository } from "./types";

export interface SubsystemInfo {
  name: string;
  type:
    | "frontend"
    | "backend"
    | "api"
    | "auth"
    | "data"
    | "config"
    | "cli"
    | "feature";
  files: string[];
  confidence: number;
  description: string;
}

export interface ArchitecturalPattern {
  pattern: string;
  description: string;
  evidence: string[];
}

export interface SubsystemAnalysis {
  subsystems: SubsystemInfo[];
  patterns: ArchitecturalPattern[];
  projectType: string;
  architecture: string;
}

export function analyzeSubsystems(
  repository: GitHubRepository,
  files: RepositoryFile[]
): SubsystemAnalysis {
  const filePaths = files.map((f) => f.path);

  // Detect subsystems based on file patterns
  const detectedSubsystems = [
    ...detectFrontend(filePaths),
    ...detectBackend(filePaths),
    ...detectAPI(filePaths),
    ...detectAuth(filePaths),
    ...detectData(filePaths),
    ...detectConfig(filePaths),
    ...detectCLI(filePaths),
    ...detectFeatures(filePaths),
  ];

  // Remove duplicates and low confidence subsystems
  const uniqueSubsystems = detectedSubsystems
    .filter((s) => s.confidence > 0.3)
    .reduce((acc, current) => {
      const existing = acc.find((s) => s.name === current.name);
      if (!existing) {
        acc.push(current);
      } else if (current.confidence > existing.confidence) {
        acc[acc.indexOf(existing)] = current;
      }
      return acc;
    }, [] as SubsystemInfo[]);

  // Detect architectural patterns
  const detectedPatterns = [
    ...detectMVCPattern(filePaths),
    ...detectMicroservicesPattern(filePaths),
    ...detectJAMStackPattern(filePaths),
    ...detectMonolithPattern(filePaths),
    ...detectContainerPattern(filePaths),
  ];

  // Determine project type and architecture
  const projectType = determineProjectType(repository, filePaths);
  const architecture = determineArchitecture(
    uniqueSubsystems,
    detectedPatterns
  );

  return {
    subsystems: uniqueSubsystems,
    patterns: detectedPatterns,
    projectType,
    architecture,
  };
}

function detectFrontend(filePaths: string[]): SubsystemInfo[] {
  const frontendPatterns = [
    {
      pattern:
        /^(pages|components|views|src\/pages|src\/components|src\/views)\//,
      weight: 0.8,
    },
    { pattern: /^(public|static|assets)\//, weight: 0.6 },
    { pattern: /\.(jsx|tsx|vue|svelte)$/, weight: 0.7 },
    { pattern: /^(styles|css|scss)\//, weight: 0.5 },
  ];

  const matches = findMatches(filePaths, frontendPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Frontend",
        type: "frontend",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "User interface components and frontend logic",
      },
    ];
  }
  return [];
}

function detectBackend(filePaths: string[]): SubsystemInfo[] {
  const backendPatterns = [
    { pattern: /^(server|backend|api)\//, weight: 0.8 },
    { pattern: /^(controllers|handlers|routes)\//, weight: 0.7 },
    { pattern: /^(services|business|domain)\//, weight: 0.6 },
  ];

  const matches = findMatches(filePaths, backendPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Backend",
        type: "backend",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "Server-side logic and business rules",
      },
    ];
  }
  return [];
}

function detectAPI(filePaths: string[]): SubsystemInfo[] {
  const apiPatterns = [
    { pattern: /^(api|endpoints|routes)\//, weight: 0.8 },
    { pattern: /\/api\//, weight: 0.7 },
    { pattern: /\.(route|endpoint|api)\.(js|ts)$/, weight: 0.6 },
  ];

  const matches = findMatches(filePaths, apiPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "API",
        type: "api",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "REST API endpoints and HTTP handlers",
      },
    ];
  }
  return [];
}

function detectAuth(filePaths: string[]): SubsystemInfo[] {
  const authPatterns = [
    { pattern: /^(auth|authentication|authorization)\//, weight: 0.9 },
    { pattern: /\/(auth|login|register|jwt)\//, weight: 0.8 },
    { pattern: /^(middleware|guards)\//, weight: 0.6 },
    { pattern: /\.(auth|login|middleware)\.(js|ts)$/, weight: 0.7 },
  ];

  const matches = findMatches(filePaths, authPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Authentication",
        type: "auth",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "User authentication and authorization system",
      },
    ];
  }
  return [];
}

function detectData(filePaths: string[]): SubsystemInfo[] {
  const dataPatterns = [
    { pattern: /^(models|database|db|data)\//, weight: 0.8 },
    { pattern: /^(repositories|dao|orm)\//, weight: 0.7 },
    { pattern: /\.(model|schema|migration)\.(js|ts)$/, weight: 0.6 },
  ];

  const matches = findMatches(filePaths, dataPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Data Layer",
        type: "data",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "Database models, schemas, and data access logic",
      },
    ];
  }
  return [];
}

function detectConfig(filePaths: string[]): SubsystemInfo[] {
  const configPatterns = [
    { pattern: /^(config|configuration)\//, weight: 0.7 },
    { pattern: /\.(config|env|json|yaml|yml)$/, weight: 0.5 },
    { pattern: /^(docker|k8s|kubernetes|deployment)\//, weight: 0.6 },
    { pattern: /^\.env/, weight: 0.6 },
  ];

  const matches = findMatches(filePaths, configPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Configuration",
        type: "config",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "Configuration files and deployment settings",
      },
    ];
  }
  return [];
}

function detectCLI(filePaths: string[]): SubsystemInfo[] {
  const cliPatterns = [
    { pattern: /^(bin|cli|scripts|tools)\//, weight: 0.8 },
    { pattern: /\.(cli|command|script)\.(js|ts)$/, weight: 0.7 },
  ];

  const matches = findMatches(filePaths, cliPatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "CLI Tools",
        type: "cli",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "Command-line interface and utility scripts",
      },
    ];
  }
  return [];
}

function detectFeatures(filePaths: string[]): SubsystemInfo[] {
  const featurePatterns = [
    { pattern: /^(features|modules)\//, weight: 0.7 },
    { pattern: /\/(user|product|order|payment|dashboard)\//, weight: 0.6 },
  ];

  const matches = findMatches(filePaths, featurePatterns);

  if (matches.files.length > 0) {
    return [
      {
        name: "Feature Modules",
        type: "feature",
        files: matches.files,
        confidence: Math.min(matches.score, 1.0),
        description: "Feature-based modules and business domains",
      },
    ];
  }
  return [];
}

function detectMVCPattern(filePaths: string[]): ArchitecturalPattern[] {
  const hasModels = filePaths.some((p) => /\/(models|model)\//.test(p));
  const hasViews = filePaths.some((p) => /\/(views|view)\//.test(p));
  const hasControllers = filePaths.some((p) =>
    /\/(controllers|controller)\//.test(p)
  );

  if (hasModels && hasViews && hasControllers) {
    return [
      {
        pattern: "MVC (Model-View-Controller)",
        description: "Classic MVC architectural pattern with separate concerns",
        evidence: ["models/", "views/", "controllers/"],
      },
    ];
  }
  return [];
}

function detectMicroservicesPattern(
  filePaths: string[]
): ArchitecturalPattern[] {
  const servicePatterns = filePaths.filter((p) =>
    /\/(services|service)\//.test(p)
  );
  const hasDocker = filePaths.some((p) => /dockerfile|docker-compose/i.test(p));
  const hasK8s = filePaths.some((p) => /k8s|kubernetes/i.test(p));

  if (servicePatterns.length > 2 && (hasDocker || hasK8s)) {
    return [
      {
        pattern: "Microservices",
        description: "Distributed architecture with multiple services",
        evidence: ["Multiple service directories", "Containerization setup"],
      },
    ];
  }
  return [];
}

function detectJAMStackPattern(filePaths: string[]): ArchitecturalPattern[] {
  const hasStatic = filePaths.some((p) => /^(public|static|dist)\//.test(p));
  const hasAPI = filePaths.some((p) => /\/api\//.test(p));
  const hasJS = filePaths.some((p) => /\.(js|ts|jsx|tsx)$/.test(p));

  if (hasStatic && hasAPI && hasJS) {
    return [
      {
        pattern: "JAMStack",
        description: "JavaScript, APIs, and Markup architecture",
        evidence: ["Static assets", "API endpoints", "JavaScript/TypeScript"],
      },
    ];
  }
  return [];
}

function detectMonolithPattern(filePaths: string[]): ArchitecturalPattern[] {
  const hasMultipleConcerns =
    [
      filePaths.some((p) => /\/(models|model)\//.test(p)),
      filePaths.some((p) => /\/(views|view|components)\//.test(p)),
      filePaths.some((p) => /\/(controllers|routes|api)\//.test(p)),
      filePaths.some((p) => /\/(services|business)\//.test(p)),
    ].filter(Boolean).length >= 3;

  const noMicroservices = !filePaths.some((p) =>
    /docker|k8s|kubernetes/i.test(p)
  );

  if (hasMultipleConcerns && noMicroservices) {
    return [
      {
        pattern: "Monolithic",
        description: "Single deployable unit with multiple concerns",
        evidence: ["Unified codebase", "Multiple architectural layers"],
      },
    ];
  }
  return [];
}

function detectContainerPattern(filePaths: string[]): ArchitecturalPattern[] {
  const hasDocker = filePaths.some((p) => /dockerfile|docker-compose/i.test(p));
  const hasK8s = filePaths.some((p) => /k8s|kubernetes/i.test(p));

  if (hasDocker || hasK8s) {
    return [
      {
        pattern: "Containerized",
        description: "Application designed for container deployment",
        evidence: hasDocker
          ? ["Dockerfile", "Docker Compose"]
          : ["Kubernetes manifests"],
      },
    ];
  }
  return [];
}

function findMatches(
  filePaths: string[],
  patterns: { pattern: RegExp; weight: number }[]
): { files: string[]; score: number } {
  const matches = new Set<string>();
  let totalScore = 0;

  for (const { pattern, weight } of patterns) {
    const matchingFiles = filePaths.filter((path) => pattern.test(path));
    matchingFiles.forEach((file) => matches.add(file));
    if (matchingFiles.length > 0) {
      totalScore += weight * Math.min(matchingFiles.length / 5, 1); // Normalize by file count
    }
  }

  return {
    files: Array.from(matches),
    score: totalScore,
  };
}

function determineProjectType(
  repository: GitHubRepository,
  filePaths: string[]
): string {
  const language = repository.language?.toLowerCase() || "";

  // Check for specific frameworks/platforms
  if (filePaths.some((p) => p === "package.json")) {
    if (filePaths.some((p) => p === "next.config.js" || p === "next.config.ts"))
      return "Next.js Application";
    if (
      filePaths.some((p) => p.includes("pages/") || p.includes("components/"))
    )
      return "React Application";
    if (filePaths.some((p) => p.includes("express") || p.includes("server")))
      return "Node.js Server";
    return "JavaScript/TypeScript Project";
  }

  if (filePaths.some((p) => p === "requirements.txt" || p === "setup.py"))
    return "Python Project";
  if (filePaths.some((p) => p === "Cargo.toml")) return "Rust Project";
  if (filePaths.some((p) => p === "go.mod")) return "Go Project";
  if (filePaths.some((p) => p === "pom.xml" || p === "build.gradle"))
    return "Java Project";

  if (language)
    return `${language.charAt(0).toUpperCase() + language.slice(1)} Project`;

  return "Software Project";
}

function determineArchitecture(
  subsystems: SubsystemInfo[],
  patterns: ArchitecturalPattern[]
): string {
  if (patterns.find((p) => p.pattern === "Microservices"))
    return "Microservices Architecture";
  if (patterns.find((p) => p.pattern === "JAMStack"))
    return "JAMStack Architecture";
  if (patterns.find((p) => p.pattern === "MVC (Model-View-Controller)"))
    return "MVC Architecture";
  if (patterns.find((p) => p.pattern === "Monolithic"))
    return "Monolithic Architecture";

  const hasApi = subsystems.some((s) => s.type === "api");
  const hasFrontend = subsystems.some((s) => s.type === "frontend");
  const hasBackend = subsystems.some((s) => s.type === "backend");

  if (hasApi && hasFrontend && hasBackend) return "Full-Stack Architecture";
  if (hasFrontend && hasApi) return "Frontend with API";
  if (hasBackend || hasApi) return "Backend Service";
  if (hasFrontend) return "Frontend Application";

  return "Custom Architecture";
}
