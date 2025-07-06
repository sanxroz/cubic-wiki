import { RepositoryFile } from "./types";

export interface DependencyInsight {
  name: string;
  type: "internal" | "external";
  count: number;
}

export interface TestCoverageInsight {
  percentage: number;
  testedFiles: number;
  totalFiles: number;
  testFiles: string[];
  testFramework?: string;
  untestedFiles: string[];
  testToSourceMapping: Record<string, string[]>; // Now simplified/empty
  qualityMetrics: {
    avgTestFileSize: number; // Simplified to 0
    testToSourceRatio: number; // Simplified calculation
  };
}

export interface InsightsData {
  dependencies: DependencyInsight[];
  testCoverage: TestCoverageInsight;
}

export function analyzeInsights(files: RepositoryFile[]): InsightsData {
  const dependencies = analyzeDependencies(files);
  const testCoverage = analyzeTestCoverage(files);

  return {
    dependencies,
    testCoverage,
  };
}

function analyzeDependencies(files: RepositoryFile[]): DependencyInsight[] {
  // Get declared dependencies from manifest files
  const manifestDeps = parseManifestDependencies(files);

  // Get import usage patterns (existing analysis)
  const importDeps = analyzeImportStatements(files);

  // Combine and deduplicate, prioritizing manifest dependencies
  const combined = new Map<string, DependencyInsight>();

  // Add manifest dependencies first (these are authoritative)
  manifestDeps.forEach((dep) => combined.set(dep.name, dep));

  // Add import dependencies, but don't overwrite manifest ones
  importDeps.forEach((dep) => {
    if (!combined.has(dep.name)) {
      combined.set(dep.name, dep);
    } else {
      // If it exists in manifest, just update the usage count
      const existing = combined.get(dep.name)!;
      existing.count = Math.max(existing.count, dep.count);
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 total
}

function parseManifestDependencies(
  files: RepositoryFile[]
): DependencyInsight[] {
  const dependencies: DependencyInsight[] = [];

  // Expanded manifest file detection for multiple ecosystems
  const manifestFiles = files.filter((file) => {
    const filename = file.path.split("/").pop() || "";
    const lowercaseFilename = filename.toLowerCase();

    return (
      [
        // Node.js ecosystem
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        // Python ecosystem
        "requirements.txt",
        "pyproject.toml",
        "setup.py",
        "pipfile",
        "pipfile.lock",
        // Java ecosystem
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "gradle.properties",
        // .NET ecosystem
        "packages.config",
        "directory.build.props",
        // Ruby ecosystem
        "gemfile",
        "gemfile.lock",
        // Go ecosystem
        "go.mod",
        "go.sum",
        // Rust ecosystem
        "cargo.toml",
        "cargo.lock",
        // PHP ecosystem
        "composer.json",
        "composer.lock",
        // Dart/Flutter
        "pubspec.yaml",
        "pubspec.lock",
        // Swift
        "package.swift",
        // CMake
        "cmakelists.txt",
      ].includes(lowercaseFilename) ||
      // .NET project files
      filename.endsWith(".csproj") ||
      filename.endsWith(".vbproj") ||
      filename.endsWith(".fsproj") ||
      // Requirements files with prefixes
      (filename.includes("requirements") && filename.endsWith(".txt"))
    );
  });

  for (const file of manifestFiles) {
    const filename = file.path.split("/").pop() || "";
    const lowercaseFilename = filename.toLowerCase();

    try {
      // Node.js ecosystem
      if (filename === "package.json") {
        const pkg = JSON.parse(file.content);

        // Production dependencies (higher weight)
        if (pkg.dependencies) {
          Object.entries(pkg.dependencies).forEach(([name]) => {
            dependencies.push({ name, type: "external", count: 8 });
          });
        }

        // Dev dependencies (medium weight)
        if (pkg.devDependencies) {
          Object.entries(pkg.devDependencies).forEach(([name]) => {
            dependencies.push({ name, type: "external", count: 5 });
          });
        }

        // Peer dependencies (lower weight)
        if (pkg.peerDependencies) {
          Object.entries(pkg.peerDependencies).forEach(([name]) => {
            dependencies.push({ name, type: "external", count: 3 });
          });
        }

        // Optional dependencies
        if (pkg.optionalDependencies) {
          Object.entries(pkg.optionalDependencies).forEach(([name]) => {
            dependencies.push({ name, type: "external", count: 2 });
          });
        }
      }

      // Python ecosystem
      else if (
        lowercaseFilename.includes("requirements") &&
        filename.endsWith(".txt")
      ) {
        const lines = file.content.split("\n");
        lines.forEach((line) => {
          const cleaned = line.trim();
          if (
            cleaned &&
            !cleaned.startsWith("#") &&
            !cleaned.startsWith("-") &&
            !cleaned.startsWith("git+")
          ) {
            // Extract package name (before ==, >=, etc.)
            const match = cleaned.match(/^([a-zA-Z0-9_.-]+)/);
            if (match && match[1]) {
              dependencies.push({ name: match[1], type: "external", count: 7 });
            }
          }
        });
      } else if (lowercaseFilename === "pyproject.toml") {
        // Enhanced TOML parsing for Python dependencies
        const lines = file.content.split("\n");
        let inDependencies = false;
        let inDevDependencies = false;

        lines.forEach((line) => {
          const cleaned = line.trim();

          // Check for different dependency sections
          if (
            cleaned === "[tool.poetry.dependencies]" ||
            cleaned === "[project.dependencies]" ||
            cleaned === "[build-system.requires]"
          ) {
            inDependencies = true;
            inDevDependencies = false;
          } else if (
            cleaned === "[tool.poetry.group.dev.dependencies]" ||
            cleaned === "[tool.poetry.dev-dependencies]"
          ) {
            inDevDependencies = true;
            inDependencies = false;
          } else if (
            cleaned.startsWith("[") &&
            (inDependencies || inDevDependencies)
          ) {
            inDependencies = false;
            inDevDependencies = false;
          } else if (
            (inDependencies || inDevDependencies) &&
            cleaned.includes("=")
          ) {
            const match = cleaned.match(/^([a-zA-Z0-9_.-]+)\s*=/);
            if (match && match[1] !== "python") {
              const weight = inDevDependencies ? 4 : 7;
              dependencies.push({
                name: match[1],
                type: "external",
                count: weight,
              });
            }
          }
        });
      } else if (lowercaseFilename === "pipfile") {
        // Basic Pipfile parsing
        try {
          const lines = file.content.split("\n");
          let inPackages = false;
          let inDevPackages = false;

          lines.forEach((line) => {
            const cleaned = line.trim();
            if (cleaned === "[packages]") {
              inPackages = true;
              inDevPackages = false;
            } else if (cleaned === "[dev-packages]") {
              inDevPackages = true;
              inPackages = false;
            } else if (
              cleaned.startsWith("[") &&
              (inPackages || inDevPackages)
            ) {
              inPackages = false;
              inDevPackages = false;
            } else if ((inPackages || inDevPackages) && cleaned.includes("=")) {
              const match = cleaned.match(/^([a-zA-Z0-9_.-]+)\s*=/);
              if (match) {
                const weight = inDevPackages ? 4 : 7;
                dependencies.push({
                  name: match[1],
                  type: "external",
                  count: weight,
                });
              }
            }
          });
        } catch {
          // Fallback to simple regex
          const matches = file.content.matchAll(/^([a-zA-Z0-9_.-]+)\s*=/gm);
          for (const match of matches) {
            if (
              match[1] &&
              !["source", "url", "verify_ssl"].includes(match[1])
            ) {
              dependencies.push({ name: match[1], type: "external", count: 6 });
            }
          }
        }
      }

      // Java ecosystem
      else if (filename === "pom.xml") {
        // Extract dependencies from Maven POM
        const dependencyMatches = file.content.matchAll(
          /<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>/g
        );
        for (const match of dependencyMatches) {
          const [, groupId, artifactId] = match;
          dependencies.push({
            name: `${groupId}:${artifactId}`,
            type: "external",
            count: 6,
          });
        }
      } else if (lowercaseFilename.includes("build.gradle")) {
        // Extract dependencies from Gradle build files
        const dependencyMatches = [
          ...file.content.matchAll(
            /(?:implementation|api|compile|testImplementation|androidTestImplementation)\s+['"]([^'"]+)['"]/g
          ),
          ...file.content.matchAll(
            /(?:implementation|api|compile|testImplementation|androidTestImplementation)\s*\(\s*['"]([^'"]+)['"]/g
          ),
        ];

        for (const match of dependencyMatches) {
          const depString = match[1];
          if (depString && depString.includes(":")) {
            const parts = depString.split(":");
            if (parts.length >= 2) {
              dependencies.push({
                name: `${parts[0]}:${parts[1]}`,
                type: "external",
                count: 6,
              });
            }
          }
        }
      }

      // Go ecosystem
      else if (lowercaseFilename === "go.mod") {
        const lines = file.content.split("\n");
        let inRequire = false;

        lines.forEach((line) => {
          const cleaned = line.trim();

          if (cleaned === "require (") {
            inRequire = true;
          } else if (cleaned === ")" && inRequire) {
            inRequire = false;
          } else if (cleaned.startsWith("require ") && !cleaned.includes("(")) {
            // Single line require
            const match = cleaned.match(/require\s+([^\s]+)/);
            if (match && match[1]) {
              dependencies.push({ name: match[1], type: "external", count: 6 });
            }
          } else if (inRequire && cleaned && !cleaned.startsWith("//")) {
            // Multi-line require block
            const match = cleaned.match(/^([^\s]+)/);
            if (
              match &&
              match[1] &&
              !match[1].includes("(") &&
              !match[1].includes(")")
            ) {
              dependencies.push({ name: match[1], type: "external", count: 6 });
            }
          }
        });
      }

      // Rust ecosystem
      else if (lowercaseFilename === "cargo.toml") {
        const lines = file.content.split("\n");
        let inDependencies = false;
        let inDevDependencies = false;

        lines.forEach((line) => {
          const cleaned = line.trim();
          if (cleaned === "[dependencies]") {
            inDependencies = true;
            inDevDependencies = false;
          } else if (cleaned === "[dev-dependencies]") {
            inDevDependencies = true;
            inDependencies = false;
          } else if (
            cleaned.startsWith("[") &&
            (inDependencies || inDevDependencies)
          ) {
            inDependencies = false;
            inDevDependencies = false;
          } else if (
            (inDependencies || inDevDependencies) &&
            cleaned.includes("=")
          ) {
            const match = cleaned.match(/^([a-zA-Z0-9_-]+)\s*=/);
            if (match) {
              const weight = inDevDependencies ? 4 : 7;
              dependencies.push({
                name: match[1],
                type: "external",
                count: weight,
              });
            }
          }
        });
      }

      // PHP ecosystem
      else if (lowercaseFilename === "composer.json") {
        const composer = JSON.parse(file.content);

        if (composer.require) {
          Object.keys(composer.require).forEach((name) => {
            if (name !== "php") {
              dependencies.push({ name, type: "external", count: 7 });
            }
          });
        }

        if (composer["require-dev"]) {
          Object.keys(composer["require-dev"]).forEach((name) => {
            dependencies.push({ name, type: "external", count: 4 });
          });
        }
      }

      // Ruby ecosystem
      else if (lowercaseFilename === "gemfile") {
        const lines = file.content.split("\n");
        lines.forEach((line) => {
          const cleaned = line.trim();
          const match = cleaned.match(/gem\s+['"]([^'"]+)['"]/);
          if (match && match[1]) {
            dependencies.push({ name: match[1], type: "external", count: 6 });
          }
        });
      }

      // Dart/Flutter ecosystem
      else if (lowercaseFilename === "pubspec.yaml") {
        const lines = file.content.split("\n");
        let inDependencies = false;
        let inDevDependencies = false;

        lines.forEach((line) => {
          const cleaned = line.trim();
          if (cleaned === "dependencies:") {
            inDependencies = true;
            inDevDependencies = false;
          } else if (cleaned === "dev_dependencies:") {
            inDevDependencies = true;
            inDependencies = false;
          } else if (
            cleaned &&
            !cleaned.startsWith(" ") &&
            cleaned.endsWith(":") &&
            (inDependencies || inDevDependencies)
          ) {
            inDependencies = false;
            inDevDependencies = false;
          } else if (
            (inDependencies || inDevDependencies) &&
            cleaned.includes(":")
          ) {
            const match = cleaned.match(/^([a-zA-Z0-9_]+):/);
            if (match && match[1] !== "flutter" && match[1] !== "sdk") {
              const weight = inDevDependencies ? 4 : 7;
              dependencies.push({
                name: match[1],
                type: "external",
                count: weight,
              });
            }
          }
        });
      }

      // .NET ecosystem
      else if (
        filename.endsWith(".csproj") ||
        filename.endsWith(".vbproj") ||
        filename.endsWith(".fsproj")
      ) {
        const packageMatches = file.content.matchAll(
          /<PackageReference\s+Include="([^"]+)"/g
        );
        for (const match of packageMatches) {
          if (match[1]) {
            dependencies.push({ name: match[1], type: "external", count: 6 });
          }
        }
      }
    } catch (error) {
      // Ignore parsing errors for individual files
      console.warn(`Failed to parse ${filename}:`, error);
    }
  }

  return dependencies;
}

function analyzeImportStatements(files: RepositoryFile[]): DependencyInsight[] {
  const externalDeps = new Map<string, number>();
  const internalDeps = new Map<string, number>();

  // Analyze multiple file types for imports
  const codeFiles = files.filter((file) =>
    /\.(js|jsx|ts|tsx|py|go|java|php|rb|rs|dart|swift|kt|scala|cs)$/.test(
      file.path
    )
  );

  for (const file of codeFiles) {
    const extension = file.path.split(".").pop()?.toLowerCase();

    // Language-specific import pattern analysis
    if (["js", "jsx", "ts", "tsx"].includes(extension || "")) {
      analyzeJavaScriptImports(file, externalDeps, internalDeps);
    } else if (extension === "py") {
      analyzePythonImports(file, externalDeps, internalDeps);
    } else if (extension === "go") {
      analyzeGoImports(file, externalDeps, internalDeps);
    } else if (extension === "java") {
      analyzeJavaImports(file, externalDeps, internalDeps);
    } else if (extension === "php") {
      analyzePHPImports(file, externalDeps, internalDeps);
    } else if (extension === "rb") {
      analyzeRubyImports(file, externalDeps, internalDeps);
    } else if (extension === "rs") {
      analyzeRustImports(file, externalDeps, internalDeps);
    } else if (extension === "dart") {
      analyzeDartImports(file, externalDeps, internalDeps);
    } else if (["cs"].includes(extension || "")) {
      analyzeCSharpImports(file, externalDeps, internalDeps);
    }
  }

  // Convert to array and sort by usage count
  const external = Array.from(externalDeps.entries())
    .map(([name, count]) => ({ name, type: "external" as const, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15

  const internal = Array.from(internalDeps.entries())
    .map(([name, count]) => ({ name, type: "internal" as const, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return [...external, ...internal];
}

// JavaScript/TypeScript import analysis
function analyzeJavaScriptImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  // Enhanced patterns for JS/TS imports
  const importPatterns = [
    // ES6 imports
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"`]([^'"`]+)['"`]/g,
    // CommonJS require
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // Dynamic imports
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // AMD require
    /define\s*\(\s*\[.*?['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of importPatterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      processImportPath(importPath, externalDeps, internalDeps, "js");
    }
  }
}

// Python import analysis
function analyzePythonImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const patterns = [
    // from package import module
    /from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import/g,
    // import package
    /^import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gm,
  ];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      // Check if it's a relative import or standard library
      if (importPath.startsWith(".")) {
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      } else if (!isPythonStandardLibrary(importPath)) {
        const packageName = importPath.split(".")[0];
        externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
      }
    }
  }
}

// Go import analysis
function analyzeGoImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  // Single and multi-line import patterns
  const patterns = [/import\s+"([^"]+)"/g, /import\s+\(\s*\n([\s\S]*?)\)/g];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      if (match[1].includes("\n")) {
        // Multi-line imports
        const lines = match[1].split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          const importMatch = trimmed.match(/"([^"]+)"/);
          if (importMatch) {
            processGoImportPath(importMatch[1], externalDeps, internalDeps);
          }
        }
      } else {
        // Single import
        processGoImportPath(match[1], externalDeps, internalDeps);
      }
    }
  }
}

// Java import analysis
function analyzeJavaImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const pattern = /import\s+(?:static\s+)?([a-zA-Z_][a-zA-Z0-9_.]*);/g;
  const matches = file.content.matchAll(pattern);

  for (const match of matches) {
    const importPath = match[1];
    if (!importPath) continue;

    const parts = importPath.split(".");
    if (parts.length >= 2) {
      // Check if it's a standard library or third-party
      if (importPath.startsWith("java.") || importPath.startsWith("javax.")) {
        // Skip standard library
        continue;
      }

      // Use first two parts as package identifier
      const packageName = parts.slice(0, 2).join(".");
      if (isProjectInternal(packageName, file.path)) {
        internalDeps.set(packageName, (internalDeps.get(packageName) || 0) + 1);
      } else {
        externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
      }
    }
  }
}

// PHP import analysis
function analyzePHPImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const patterns = [
    /use\s+([a-zA-Z_\\][a-zA-Z0-9_\\]*);/g,
    /require(?:_once)?\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /include(?:_once)?\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      if (importPath.includes("\\")) {
        // Namespace import
        const parts = importPath.split("\\");
        const packageName = parts[0];
        externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
      } else if (importPath.startsWith("./") || importPath.startsWith("../")) {
        // Relative path
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      }
    }
  }
}

// Ruby import analysis
function analyzeRubyImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const patterns = [
    /require\s+['"`]([^'"`]+)['"`]/g,
    /require_relative\s+['"`]([^'"`]+)['"`]/g,
    /gem\s+['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      if (
        pattern.source.includes("require_relative") ||
        importPath.startsWith("./")
      ) {
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      } else {
        const packageName = importPath.split("/")[0];
        externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
      }
    }
  }
}

// Rust import analysis
function analyzeRustImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const patterns = [
    /use\s+([a-zA-Z_][a-zA-Z0-9_]*(?:::[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
    /extern\s+crate\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      const rootCrate = importPath.split("::")[0];

      if (
        rootCrate === "std" ||
        rootCrate === "core" ||
        rootCrate === "alloc"
      ) {
        // Skip standard library
        continue;
      }

      if (
        rootCrate === "crate" ||
        rootCrate === "super" ||
        rootCrate === "self"
      ) {
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      } else {
        externalDeps.set(rootCrate, (externalDeps.get(rootCrate) || 0) + 1);
      }
    }
  }
}

// Dart import analysis
function analyzeDartImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const patterns = [
    /import\s+['"`]([^'"`]+)['"`]/g,
    /export\s+['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of patterns) {
    const matches = file.content.matchAll(pattern);
    for (const match of matches) {
      const importPath = match[1];
      if (!importPath) continue;

      if (importPath.startsWith("package:")) {
        const packageName = importPath.replace("package:", "").split("/")[0];
        if (packageName !== "flutter") {
          externalDeps.set(
            packageName,
            (externalDeps.get(packageName) || 0) + 1
          );
        }
      } else if (importPath.startsWith("dart:")) {
        // Skip Dart standard library
        continue;
      } else {
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      }
    }
  }
}

// C# import analysis
function analyzeCSharpImports(
  file: { content: string; path: string },
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  const pattern = /using\s+([a-zA-Z_][a-zA-Z0-9_.]*);/g;
  const matches = file.content.matchAll(pattern);

  for (const match of matches) {
    const importPath = match[1];
    if (!importPath) continue;

    const parts = importPath.split(".");
    if (parts.length >= 1) {
      const rootNamespace = parts[0];

      // Skip system namespaces
      if (rootNamespace === "System" || rootNamespace === "Microsoft") {
        continue;
      }

      if (isProjectInternal(rootNamespace, file.path)) {
        internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
      } else {
        externalDeps.set(
          rootNamespace,
          (externalDeps.get(rootNamespace) || 0) + 1
        );
      }
    }
  }
}

// Helper functions
function processImportPath(
  importPath: string,
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>,
  language: string
) {
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    // Internal dependency
    const cleanPath = importPath.replace(/\.(js|jsx|ts|tsx)$/, "");
    internalDeps.set(cleanPath, (internalDeps.get(cleanPath) || 0) + 1);
  } else if (
    !importPath.includes("node:") &&
    !importPath.includes("std/") &&
    !isBuiltInModule(importPath, language)
  ) {
    // External dependency (not built-in modules)
    const packageName = importPath.split("/")[0];
    if (packageName.startsWith("@")) {
      // Scoped package
      const scopedName = importPath.split("/").slice(0, 2).join("/");
      externalDeps.set(scopedName, (externalDeps.get(scopedName) || 0) + 1);
    } else {
      externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
    }
  }
}

function processGoImportPath(
  importPath: string,
  externalDeps: Map<string, number>,
  internalDeps: Map<string, number>
) {
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    internalDeps.set(importPath, (internalDeps.get(importPath) || 0) + 1);
  } else if (!isGoStandardLibrary(importPath)) {
    // External dependency
    const parts = importPath.split("/");
    let packageName = importPath;

    // Handle common hosting patterns
    if (parts[0] === "github.com" || parts[0] === "gitlab.com") {
      packageName = parts.slice(0, 3).join("/"); // github.com/user/repo
    } else if (parts[0].includes(".")) {
      packageName = parts[0]; // domain.com
    }

    externalDeps.set(packageName, (externalDeps.get(packageName) || 0) + 1);
  }
}

function isPythonStandardLibrary(module: string): boolean {
  const stdLibModules = [
    "os",
    "sys",
    "json",
    "re",
    "math",
    "datetime",
    "collections",
    "itertools",
    "functools",
    "operator",
    "copy",
    "pickle",
    "sqlite3",
    "urllib",
    "http",
    "email",
    "html",
    "xml",
    "csv",
    "configparser",
    "logging",
    "unittest",
    "threading",
    "multiprocessing",
    "subprocess",
    "shutil",
    "tempfile",
    "pathlib",
    "glob",
    "fnmatch",
    "random",
    "hashlib",
    "hmac",
    "secrets",
    "typing",
    "dataclasses",
    "enum",
    "abc",
    "contextlib",
    "weakref",
  ];

  const rootModule = module.split(".")[0];
  return stdLibModules.includes(rootModule);
}

function isGoStandardLibrary(importPath: string): boolean {
  const stdLibPrefixes = [
    "fmt",
    "os",
    "io",
    "net",
    "http",
    "time",
    "strings",
    "strconv",
    "sort",
    "math",
    "crypto",
    "encoding",
    "database",
    "context",
    "sync",
    "regexp",
    "path",
    "log",
    "flag",
    "bufio",
    "bytes",
    "errors",
    "reflect",
    "runtime",
    "testing",
    "unsafe",
    "archive",
    "compress",
    "container",
    "debug",
    "go",
    "hash",
    "image",
    "index",
    "mime",
    "plugin",
    "text",
    "unicode",
  ];

  const rootPackage = importPath.split("/")[0];
  return stdLibPrefixes.includes(rootPackage) || !importPath.includes(".");
}

function isBuiltInModule(importPath: string, language: string): boolean {
  if (language === "js") {
    const builtInModules = [
      "fs",
      "path",
      "os",
      "crypto",
      "http",
      "https",
      "url",
      "querystring",
      "util",
      "events",
      "stream",
      "buffer",
      "child_process",
      "cluster",
      "dgram",
      "dns",
      "net",
      "readline",
      "repl",
      "tls",
      "tty",
      "vm",
      "zlib",
    ];
    return builtInModules.includes(importPath);
  }
  return false;
}

function isProjectInternal(packageName: string, filePath: string): boolean {
  // Simple heuristic: if the package name appears to be related to the project structure
  const pathParts = filePath.split("/");
  return pathParts.some(
    (part) =>
      part.toLowerCase().includes(packageName.toLowerCase()) ||
      packageName.toLowerCase().includes(part.toLowerCase())
  );
}

function analyzeTestCoverage(files: RepositoryFile[]): TestCoverageInsight {
  // Simplified test file detection - focus on common patterns
  const testFiles = files.filter((file) => {
    const path = file.path.toLowerCase();
    const fileName = path.split("/").pop() || "";

    return (
      // Common test file patterns
      /\.(test|spec)\.(js|jsx|ts|tsx|py|go|java|rs|php|rb)$/.test(path) ||
      // Directory patterns
      path.includes("__tests__") ||
      path.includes("/tests/") ||
      path.includes("/test/") ||
      // Python specific patterns
      /^test.*\.py$/.test(fileName) ||
      fileName === "conftest.py" ||
      // Other common patterns
      path.endsWith("_test.py") ||
      path.endsWith("_test.go") ||
      path.endsWith("_spec.rb")
    );
  });

  // Identify source files (simplified)
  const sourceFiles = files.filter((file) => {
    const path = file.path.toLowerCase();

    // Include common source file extensions
    const isCode = /\.(js|jsx|ts|tsx|py|go|java|rs|php|rb|c|cpp|cs)$/.test(
      path
    );

    // Exclude test files
    const isTest = testFiles.some((testFile) => testFile.path === file.path);

    // Exclude common non-source directories and files
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

  // Simple framework detection
  const testFramework = detectTestFramework(files);

  // Basic coverage calculation (simplified - no complex mapping)
  const totalFiles = sourceFiles.length;
  const testFileCount = testFiles.length;

  // Simple heuristic: assume reasonable test coverage if tests exist
  const estimatedCoverage =
    totalFiles > 0
      ? Math.min(Math.round((testFileCount / totalFiles) * 100), 100)
      : 0;

  // Identify files without corresponding tests (simplified)
  const untestedFiles = sourceFiles
    .filter((sourceFile) => {
      // Simple check: look for a test file that might correspond to this source file
      const sourceName =
        sourceFile.path
          .split("/")
          .pop()
          ?.replace(/\.(js|jsx|ts|tsx|py|go|java|rs|php|rb)$/, "") || "";
      return !testFiles.some((testFile) => {
        const testName = testFile.path.toLowerCase();
        return testName.includes(sourceName.toLowerCase());
      });
    })
    .map((file) => file.path)
    .sort()
    .slice(0, 20); // Limit to first 20 for UI

  return {
    percentage: estimatedCoverage,
    testedFiles:
      testFileCount > 0 ? Math.max(1, totalFiles - untestedFiles.length) : 0,
    totalFiles,
    testFiles: testFiles.map((f) => f.path),
    testFramework,
    untestedFiles,
    testToSourceMapping: {}, // Simplified - remove complex mapping
    qualityMetrics: {
      avgTestFileSize: 0, // Simplified - remove complex metrics
      testToSourceRatio:
        testFileCount > 0 && totalFiles > 0
          ? Number((testFileCount / totalFiles).toFixed(2))
          : 0,
    },
  };
}

function detectTestFramework(files: RepositoryFile[]): string | undefined {
  // Check package.json for common test frameworks
  const packageJsonFile = files.find((f) => f.path.endsWith("package.json"));
  if (packageJsonFile) {
    try {
      const pkg = JSON.parse(packageJsonFile.content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Check for most common frameworks
      if (allDeps.vitest) return "Vitest";
      if (allDeps.jest) return "Jest";
      if (allDeps.mocha) return "Mocha";
      if (allDeps.cypress) return "Cypress";
      if (allDeps["@playwright/test"]) return "Playwright";
    } catch {
      // Ignore JSON parsing errors
    }
  }

  // Simple checks for other languages
  if (files.some((f) => f.path.endsWith("conftest.py"))) return "pytest";
  if (files.some((f) => f.path.endsWith("_test.go"))) return "Go testing";

  // Check if we have Python test files (assume pytest)
  const hasTestFiles = files.some((f) => {
    const fileName = f.path.split("/").pop() || "";
    return /^test.*\.py$/.test(fileName);
  });
  if (hasTestFiles) return "pytest";

  return undefined;
}
