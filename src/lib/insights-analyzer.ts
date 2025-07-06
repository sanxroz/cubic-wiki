import { RepositoryFile } from "./types";

export interface DependencyInsight {
  name: string;
  count: number;
}

export interface TestCoverageInsight {
  percentage: number;
  testedFiles: number;
  totalFiles: number;
  testFiles: string[];
  testFramework?: string;
  untestedFiles: string[];
  testToSourceMapping: Record<string, string[]>;
  qualityMetrics: {
    avgTestFileSize: number;
    testToSourceRatio: number;
  };
}

export interface InsightsData {
  dependencies: DependencyInsight[];
  testCoverage: TestCoverageInsight;
}

// Configuration-driven manifest parsers
const MANIFEST_CONFIGS = {
  "package.json": {
    type: "json",
    sections: [
      { key: "dependencies", weight: 8 },
      { key: "devDependencies", weight: 5 },
      { key: "peerDependencies", weight: 3 },
      { key: "optionalDependencies", weight: 2 },
    ],
  },
  "composer.json": {
    type: "json",
    sections: [
      { key: "require", weight: 7, exclude: ["php"] },
      { key: "require-dev", weight: 4 },
    ],
  },
  "cargo.toml": {
    type: "toml",
    sections: [
      { pattern: "[dependencies]", weight: 7 },
      { pattern: "[dev-dependencies]", weight: 4 },
    ],
  },
  "go.mod": {
    type: "lines",
    patterns: [
      { regex: /require\s+([^\s]+)/, weight: 6 },
      { regex: /^\s*([^\s]+)\s+v/, weight: 6, multiline: true },
    ],
  },
  "pyproject.toml": {
    type: "toml",
    sections: [
      { pattern: "[tool.poetry.dependencies]", weight: 7, exclude: ["python"] },
      { pattern: "[project.dependencies]", weight: 7 },
      { pattern: "[tool.poetry.group.dev.dependencies]", weight: 4 },
      { pattern: "[tool.poetry.dev-dependencies]", weight: 4 },
    ],
  },
  "pom.xml": {
    type: "xml",
    patterns: [
      {
        regex:
          /<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>/g,
        weight: 6,
        combine: true,
      },
    ],
  },
  "pubspec.yaml": {
    type: "yaml",
    sections: [
      { pattern: "dependencies:", weight: 7, exclude: ["flutter", "sdk"] },
      { pattern: "dev_dependencies:", weight: 4 },
    ],
  },
} as const;

// Requirements.txt and similar patterns
const REQUIREMENTS_PATTERNS = {
  regex: /requirements.*\.txt$/i,
  parser: {
    type: "lines",
    patterns: [{ regex: /^([a-zA-Z0-9_.-]+)/, weight: 7 }],
  },
};

// Gradle patterns
const GRADLE_PATTERNS = {
  regex: /build\.gradle(\.kts)?$/i,
  parser: {
    type: "lines",
    patterns: [
      {
        regex:
          /(?:implementation|api|compile|testImplementation|androidTestImplementation)\s+['"]([^'"]+)['"]/g,
        weight: 6,
      },
      {
        regex:
          /(?:implementation|api|compile|testImplementation|androidTestImplementation)\s*\(\s*['"]([^'"]+)['"]/g,
        weight: 6,
      },
    ],
  },
};

// Language-specific import patterns
const IMPORT_PATTERNS = {
  js: [
    /import\s+(?:[\w*{}.s,]+\s+from\s+)?['"`]([^'"`]+)['"`]/g,
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ],
  python: [
    /from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import/g,
    /^import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gm,
  ],
  go: [/import\s+"([^"]+)"/g, /import\s+\(\s*\n([\s\S]*?)\)/g],
  java: [/import\s+(?:static\s+)?([a-zA-Z_][a-zA-Z0-9_.]*);/g],
  rust: [
    /use\s+([a-zA-Z_][a-zA-Z0-9_]*(?:::[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
    /extern\s+crate\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ],
  php: [
    /use\s+([a-zA-Z_\\][a-zA-Z0-9_\\]*);/g,
    /require(?:_once)?\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ],
  ruby: [/require\s+['"`]([^'"`]+)['"`]/g, /gem\s+['"`]([^'"`]+)['"`]/g],
  dart: [/import\s+['"`]([^'"`]+)['"`]/g, /export\s+['"`]([^'"`]+)['"`]/g],
  csharp: [/using\s+([a-zA-Z_][a-zA-Z0-9_.]*);/g],
} as const;

// Standard library patterns (more efficient than arrays)
const STD_LIB_PATTERNS = {
  python:
    /^(os|sys|json|re|math|datetime|collections|itertools|functools|operator|copy|pickle|sqlite3|urllib|http|email|html|xml|csv|configparser|logging|unittest|threading|multiprocessing|subprocess|shutil|tempfile|pathlib|glob|fnmatch|random|hashlib|hmac|secrets|typing|dataclasses|enum|abc|contextlib|weakref)(\\.|$)/,
  go: /^(fmt|os|io|net|http|time|strings|strconv|sort|math|crypto|encoding|database|context|sync|regexp|path|log|flag|bufio|bytes|errors|reflect|runtime|testing|unsafe|archive|compress|container|debug|go|hash|image|index|mime|plugin|text|unicode)($|\/)/,
  js: /^(fs|path|os|crypto|http|https|url|querystring|util|events|stream|buffer|child_process|cluster|dgram|dns|net|readline|repl|tls|tty|vm|zlib)$/,
  java: /^(java\.|javax\.)/,
  rust: /^(std|core|alloc)::/,
  csharp: /^(System|Microsoft)\./,
  php: /^()/, // PHP doesn't have a standard library pattern like others
  ruby: /^()/, // Ruby doesn't have a standard library pattern like others
  dart: /^dart:/,
} as const;

// File extension to language mapping
const EXT_TO_LANG: Record<string, keyof typeof IMPORT_PATTERNS> = {
  js: "js",
  jsx: "js",
  ts: "js",
  tsx: "js",
  py: "python",
  go: "go",
  java: "java",
  kt: "java",
  scala: "java",
  rs: "rust",
  php: "php",
  rb: "ruby",
  dart: "dart",
  cs: "csharp",
};

export function analyzeInsights(files: RepositoryFile[]): InsightsData {
  const dependencies = analyzeDependencies(files);
  const testCoverage = analyzeTestCoverage(files);

  return { dependencies, testCoverage };
}

function analyzeDependencies(files: RepositoryFile[]): DependencyInsight[] {
  const manifestDeps = parseManifestDependencies(files);
  const importDeps = analyzeImportStatements(files);

  // Combine and deduplicate
  const combined = new Map<string, DependencyInsight>();

  manifestDeps.forEach((dep) => combined.set(dep.name, dep));
  importDeps.forEach((dep) => {
    if (!combined.has(dep.name)) {
      combined.set(dep.name, dep);
    } else {
      const existing = combined.get(dep.name)!;
      existing.count = Math.max(existing.count, dep.count);
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function parseManifestDependencies(
  files: RepositoryFile[]
): DependencyInsight[] {
  const dependencies: DependencyInsight[] = [];

  for (const file of files) {
    const filename = file.path.split("/").pop()?.toLowerCase() || "";

    try {
      // Direct config match
      if (filename in MANIFEST_CONFIGS) {
        dependencies.push(
          ...parseWithConfig(
            file.content,
            MANIFEST_CONFIGS[filename as keyof typeof MANIFEST_CONFIGS]
          )
        );
        continue;
      }

      // Pattern-based matches
      if (REQUIREMENTS_PATTERNS.regex.test(filename)) {
        dependencies.push(
          ...parseWithConfig(file.content, REQUIREMENTS_PATTERNS.parser)
        );
        continue;
      }

      if (GRADLE_PATTERNS.regex.test(filename)) {
        dependencies.push(
          ...parseWithConfig(file.content, GRADLE_PATTERNS.parser)
        );
        continue;
      }

      // Project files (.csproj, .vbproj, .fsproj)
      if (/\.(cs|vb|fs)proj$/i.test(filename)) {
        const matches = file.content.matchAll(
          /<PackageReference\s+Include="([^"]+)"/g
        );
        for (const match of matches) {
          dependencies.push({ name: match[1], count: 6 });
        }
      }

      // Gemfile
      if (filename === "gemfile") {
        const matches = file.content.matchAll(/gem\s+['"]([^'"]+)['"]/g);
        for (const match of matches) {
          dependencies.push({ name: match[1], count: 6 });
        }
      }

      // Pipfile
      if (filename === "pipfile") {
        dependencies.push(...parsePipfile(file.content));
      }
    } catch (error) {
      console.warn(`Failed to parse ${filename}:`, error);
    }
  }

  return dependencies;
}

function parseWithConfig(content: string, config: any): DependencyInsight[] {
  const dependencies: DependencyInsight[] = [];

  switch (config.type) {
    case "json":
      const data = JSON.parse(content);
      for (const section of config.sections) {
        if (data[section.key]) {
          Object.keys(data[section.key]).forEach((name) => {
            if (!section.exclude?.includes(name)) {
              dependencies.push({ name, count: section.weight });
            }
          });
        }
      }
      break;

    case "toml":
    case "yaml":
      dependencies.push(...parseStructuredFile(content, config));
      break;

    case "lines":
      for (const pattern of config.patterns) {
        const matches = content.matchAll(pattern.regex);
        for (const match of matches) {
          if (pattern.combine) {
            dependencies.push({
              name: `${match[1]}:${match[2]}`,
              count: pattern.weight,
            });
          } else {
            dependencies.push({ name: match[1], count: pattern.weight });
          }
        }
      }
      break;

    case "xml":
      for (const pattern of config.patterns) {
        const matches = content.matchAll(pattern.regex);
        for (const match of matches) {
          if (pattern.combine) {
            dependencies.push({
              name: `${match[1]}:${match[2]}`,
              count: pattern.weight,
            });
          } else {
            dependencies.push({ name: match[1], count: pattern.weight });
          }
        }
      }
      break;
  }

  return dependencies;
}

function parseStructuredFile(
  content: string,
  config: any
): DependencyInsight[] {
  const dependencies: DependencyInsight[] = [];
  const lines = content.split("\n");
  let currentSection = "";
  let currentWeight = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section headers
    const section = config.sections.find((s: any) => trimmed === s.pattern);
    if (section) {
      currentSection = section.pattern;
      currentWeight = section.weight;
      continue;
    }

    // Reset section if we hit another header
    if (trimmed.startsWith("[") && currentSection) {
      currentSection = "";
      currentWeight = 0;
      continue;
    }

    // Parse dependencies in current section
    if (currentSection && trimmed.includes("=")) {
      const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=/);
      if (match && match[1]) {
        const section = config.sections.find(
          (s: any) => s.pattern === currentSection
        );
        if (!section?.exclude?.includes(match[1])) {
          dependencies.push({ name: match[1], count: currentWeight });
        }
      }
    }
  }

  return dependencies;
}

function parsePipfile(content: string): DependencyInsight[] {
  const dependencies: DependencyInsight[] = [];
  const lines = content.split("\n");
  let inPackages = false;
  let inDevPackages = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "[packages]") {
      inPackages = true;
      inDevPackages = false;
    } else if (trimmed === "[dev-packages]") {
      inDevPackages = true;
      inPackages = false;
    } else if (trimmed.startsWith("[") && (inPackages || inDevPackages)) {
      inPackages = false;
      inDevPackages = false;
    } else if ((inPackages || inDevPackages) && trimmed.includes("=")) {
      const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=/);
      if (match) {
        const weight = inDevPackages ? 4 : 7;
        dependencies.push({ name: match[1], count: weight });
      }
    }
  }

  return dependencies;
}

function analyzeImportStatements(files: RepositoryFile[]): DependencyInsight[] {
  const externalDeps = new Map<string, number>();

  const codeFiles = files.filter((file) =>
    /\.(js|jsx|ts|tsx|py|go|java|php|rb|rs|dart|swift|kt|scala|cs)$/.test(
      file.path
    )
  );

  for (const file of codeFiles) {
    const ext = file.path.split(".").pop()?.toLowerCase();
    const language = ext ? EXT_TO_LANG[ext] : null;

    if (language && IMPORT_PATTERNS[language]) {
      analyzeFileImports(
        file,
        IMPORT_PATTERNS[language],
        language,
        externalDeps
      );
    }
  }

  return Array.from(externalDeps.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function analyzeFileImports(
  file: RepositoryFile,
  patterns: readonly RegExp[],
  language: keyof typeof STD_LIB_PATTERNS,
  externalDeps: Map<string, number>
) {
  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);

    for (const match of matches) {
      let importPath = match[1];

      if (!importPath) continue;

      // Handle Go multi-line imports
      if (language === "go" && importPath.includes("\n")) {
        const lines = importPath.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          const importMatch = trimmed.match(/"([^"]+)"/);
          if (importMatch) {
            processImport(importMatch[1], language, externalDeps);
          }
        }
        continue;
      }

      processImport(importPath, language, externalDeps);
    }
  }
}

function processImport(
  importPath: string,
  language: keyof typeof STD_LIB_PATTERNS,
  externalDeps: Map<string, number>
) {
  // Skip relative imports
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    return;
  }

  // Skip standard library
  const stdPattern = STD_LIB_PATTERNS[language];
  if (stdPattern && stdPattern.test(importPath)) {
    return;
  }

  // Extract package name
  let packageName = importPath;

  switch (language) {
    case "js":
      if (importPath.startsWith("@")) {
        packageName = importPath.split("/").slice(0, 2).join("/");
      } else {
        packageName = importPath.split("/")[0];
      }
      break;

    case "python":
      packageName = importPath.split(".")[0];
      break;

    case "go":
      if (importPath.includes("/")) {
        const parts = importPath.split("/");
        if (parts[0] === "github.com" || parts[0] === "gitlab.com") {
          packageName = parts.slice(0, 3).join("/");
        } else if (parts[0].includes(".")) {
          packageName = parts[0];
        }
      }
      break;

    case "java":
      packageName = importPath.split(".").slice(0, 2).join(".");
      break;

    case "rust":
      packageName = importPath.split("::")[0];
      break;

    case "php":
      packageName = importPath.split("\\")[0];
      break;

    case "dart":
      if (importPath.startsWith("package:")) {
        packageName = importPath.replace("package:", "").split("/")[0];
      }
      break;

    case "csharp":
      packageName = importPath.split(".")[0];
      break;
  }

  if (packageName && packageName !== importPath.split(".")[0]) {
    externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
  }
}

function analyzeTestCoverage(files: RepositoryFile[]): TestCoverageInsight {
  // Test file patterns
  const testFiles = files.filter((file) => {
    const path = file.path.toLowerCase();
    const fileName = path.split("/").pop() || "";

    return (
      /\.(test|spec)\.(js|jsx|ts|tsx|py|go|java|rs|php|rb)$/.test(path) ||
      path.includes("__tests__") ||
      path.includes("/tests/") ||
      path.includes("/test/") ||
      /^test.*\.py$/.test(fileName) ||
      fileName === "conftest.py" ||
      path.endsWith("_test.py") ||
      path.endsWith("_test.go") ||
      path.endsWith("_spec.rb")
    );
  });

  // Source files
  const sourceFiles = files.filter((file) => {
    const path = file.path.toLowerCase();
    const isCode = /\.(js|jsx|ts|tsx|py|go|java|rs|php|rb|c|cpp|cs)$/.test(
      path
    );
    const isTest = testFiles.some((testFile) => testFile.path === file.path);
    const isExcluded =
      path.includes("node_modules") ||
      path.includes("dist/") ||
      path.includes("build/") ||
      path.includes(".git/") ||
      path.includes("coverage/") ||
      path.endsWith(".d.ts") ||
      path.includes("generated");

    return isCode && !isTest && !isExcluded;
  });

  const testFramework = detectTestFramework(files);
  const totalFiles = sourceFiles.length;
  const testFileCount = testFiles.length;

  const estimatedCoverage =
    totalFiles > 0
      ? Math.min(Math.round((testFileCount / totalFiles) * 100), 100)
      : 0;

  // Find untested files
  const untestedFiles = sourceFiles
    .filter((sourceFile) => {
      const sourceName =
        sourceFile.path
          .split("/")
          .pop()
          ?.replace(/\.(js|jsx|ts|tsx|py|go|java|rs|php|rb)$/, "") || "";
      return !testFiles.some((testFile) =>
        testFile.path.toLowerCase().includes(sourceName.toLowerCase())
      );
    })
    .map((file) => file.path)
    .sort()
    .slice(0, 20);

  return {
    percentage: estimatedCoverage,
    testedFiles:
      testFileCount > 0 ? Math.max(1, totalFiles - untestedFiles.length) : 0,
    totalFiles,
    testFiles: testFiles.map((f) => f.path),
    testFramework,
    untestedFiles,
    testToSourceMapping: {},
    qualityMetrics: {
      avgTestFileSize: 0,
      testToSourceRatio:
        testFileCount > 0 && totalFiles > 0
          ? Number((testFileCount / totalFiles).toFixed(2))
          : 0,
    },
  };
}

function detectTestFramework(files: RepositoryFile[]): string | undefined {
  const packageJsonFile = files.find((f) => f.path.endsWith("package.json"));

  if (packageJsonFile) {
    try {
      const pkg = JSON.parse(packageJsonFile.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      const frameworks = [
        { key: "vitest", name: "Vitest" },
        { key: "jest", name: "Jest" },
        { key: "mocha", name: "Mocha" },
        { key: "cypress", name: "Cypress" },
        { key: "@playwright/test", name: "Playwright" },
      ];

      for (const framework of frameworks) {
        if (allDeps[framework.key]) return framework.name;
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  // Language-specific detection
  if (files.some((f) => f.path.endsWith("conftest.py"))) return "pytest";
  if (files.some((f) => f.path.endsWith("_test.go"))) return "Go testing";
  if (files.some((f) => /^test.*\.py$/.test(f.path.split("/").pop() || "")))
    return "pytest";

  return undefined;
}
