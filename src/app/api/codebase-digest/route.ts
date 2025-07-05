import { NextRequest, NextResponse } from "next/server";
import {
  parseGitHubUrl,
  fetchRepositoryInfo,
  fetchRepositoryContent,
} from "@/lib/github";
import { AnalysisRequest, GitHubRepository, RepositoryFile } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { githubUrl } = body;

    if (!githubUrl) {
      return NextResponse.json(
        { success: false, error: "GitHub URL is required" },
        { status: 400 }
      );
    }

    // Validate and parse GitHub URL
    let owner: string, repo: string;
    try {
      const parsed = parseGitHubUrl(githubUrl);
      owner = parsed.owner;
      repo = parsed.repo;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid GitHub URL format" },
        { status: 400 }
      );
    }

    // Fetch repository information
    const repository = await fetchRepositoryInfo(owner, repo);

    // Fetch repository content
    const files = await fetchRepositoryContent(owner, repo);

    // If no files, return error
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No analyzable files found in repository" },
        { status: 400 }
      );
    }

    // Generate markdown digest
    const digest = generateMarkdownDigest(repository, files);

    // Return the digest
    return NextResponse.json({
      success: true,
      digest,
      metadata: {
        totalFiles: files.length,
        totalCharacters: digest.length,
        estimatedTokens: Math.ceil(digest.length / 4),
        repository: {
          name: repository.full_name,
          description: repository.description,
          language: repository.language,
          url: repository.html_url,
        },
      },
    });
  } catch (error) {
    console.error("Digest generation error:", error);

    // Return error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("API rate")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub API rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
      return NextResponse.json(
        { success: false, error: "Repository not found or is private" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Digest generation failed. Please try again." },
      { status: 500 }
    );
  }
}

function generateMarkdownDigest(
  repository: GitHubRepository,
  files: RepositoryFile[]
): string {
  const sections = [
    `# Repository: ${repository.full_name}`,
    "",
    "## Repository Info",
    `- **Description:** ${repository.description || "No description provided"}`,
    `- **Language:** ${repository.language || "Multiple languages"}`,
    `- **URL:** ${repository.html_url}`,
    `- **Default Branch:** ${repository.default_branch}`,
    "",
    "## Files",
    "",
  ];

  // Add each file (excluding package-lock.json)
  files.forEach((file) => {
    // Skip package-lock.json files
    if (
      file.path === "package-lock.json" ||
      file.path.endsWith("/package-lock.json")
    ) {
      return;
    }

    sections.push(`### ${file.path}`);
    sections.push("");

    // Determine language for syntax highlighting
    const language = getLanguageForHighlighting(file.type, file.path);

    sections.push("```" + language);
    sections.push(file.content);
    sections.push("```");
    sections.push("");
  });

  return sections.join("\n");
}

function getLanguageForHighlighting(
  fileType: string,
  filePath: string
): string {
  // Map file types to syntax highlighting languages
  const typeMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    go: "go",
    java: "java",
    json: "json",
    yaml: "yaml",
    markdown: "markdown",
  };

  if (typeMap[fileType]) {
    return typeMap[fileType];
  }

  // Fallback to file extension
  const extension = filePath.split(".").pop()?.toLowerCase();
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
    case "json":
      return "json";
    case "yml":
    case "yaml":
      return "yaml";
    case "md":
      return "markdown";
    case "css":
      return "css";
    case "html":
      return "html";
    case "xml":
      return "xml";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "bash";
    default:
      return "text";
  }
}
