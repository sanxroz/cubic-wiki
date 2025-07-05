import { Octokit } from "@octokit/rest";
import { GitHubRepository, RepositoryFile } from "./types";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
});

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }

  return {
    owner: match[1],
    repo: match[2], // .git is already handled in the regex
  };
}

export async function fetchRepositoryInfo(
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      language: response.data.language,
      default_branch: response.data.default_branch,
      html_url: response.data.html_url,
      clone_url: response.data.clone_url,
    };
  } catch (error) {
    throw new Error(`Failed to fetch repository info: ${error}`);
  }
}

export async function fetchRepositoryContent(
  owner: string,
  repo: string
): Promise<RepositoryFile[]> {
  try {
    // Get the repository tree
    const repoInfo = await fetchRepositoryInfo(owner, repo);

    const treeResponse = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: repoInfo.default_branch,
      recursive: "true",
    });

    // Filter important files
    const importantFiles = treeResponse.data.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          item.path &&
          isImportantFile(item.path) &&
          (item.size || 0) < 1000000 // Skip files > 1MB
      )
      .slice(0, 50); // Limit to first 50 files to avoid rate limits

    // Fetch file contents in parallel
    const fileContents = await Promise.all(
      importantFiles.map(async (file) => {
        if (!file.path) return null;

        try {
          const contentResponse = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.path,
          });

          if ("content" in contentResponse.data) {
            return {
              path: file.path,
              content: Buffer.from(
                contentResponse.data.content,
                "base64"
              ).toString("utf-8"),
              size: file.size || 0,
              type: getFileType(file.path),
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch ${file.path}:`, error);
          return null;
        }
        return null;
      })
    );

    return fileContents.filter(Boolean) as RepositoryFile[];
  } catch (error) {
    throw new Error(`Failed to fetch repository content: ${error}`);
  }
}

function isImportantFile(path: string): boolean {
  // High priority files
  const highPriorityFiles = [
    "README.md",
    "readme.md",
    "README.txt",
    "package.json",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "index.js",
    "index.ts",
    "main.py",
    "app.py",
    "server.js",
    "config.js",
    "config.json",
    ".env.example",
  ];

  // Important directories
  const importantDirs = [
    "src/",
    "lib/",
    "app/",
    "components/",
    "pages/",
    "api/",
  ];

  // File extensions to include
  const allowedExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".go",
    ".java",
    ".md",
    ".json",
    ".yml",
    ".yaml",
  ];

  const fileName = path.split("/").pop() || "";
  const fileExtension = "." + fileName.split(".").pop();

  // Check if it's a high priority file
  if (highPriorityFiles.includes(fileName)) {
    return true;
  }

  // Check if it's in an important directory
  if (importantDirs.some((dir) => path.startsWith(dir))) {
    return allowedExtensions.includes(fileExtension);
  }

  // Skip certain directories
  const skipDirs = [
    "node_modules/",
    "vendor/",
    "dist/",
    "build/",
    ".git/",
    ".cache/",
    "coverage/",
  ];
  if (skipDirs.some((dir) => path.includes(dir))) {
    return false;
  }

  // Include files with allowed extensions in root or shallow directories
  const depth = path.split("/").length;
  return depth <= 3 && allowedExtensions.includes(fileExtension);
}

function getFileType(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "go":
      return "go";
    case "java":
      return "java";
    case "md":
      return "markdown";
    case "json":
      return "json";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return "text";
  }
}
