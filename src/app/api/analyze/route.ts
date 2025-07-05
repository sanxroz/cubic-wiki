import { NextRequest, NextResponse } from "next/server";
import {
  parseGitHubUrl,
  fetchRepositoryInfo,
  fetchRepositoryContent,
} from "@/lib/github";
import { processRepositoryWithAI } from "@/lib/ai";
import { AnalysisRequest, AnalysisResponse } from "@/lib/types";
import { getCachedAnalysis, cacheAnalysis } from "@/lib/cache";

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

    // Check cache if we already have cached analysis
    const cacheKey = encodeURIComponent(githubUrl);
    const cachedData = await getCachedAnalysis(cacheKey);

    // if we have cached data, redirect to results
    if (cachedData) {
      return NextResponse.json({
        success: true,
        redirectUrl: `/repo/${cacheKey}`,
      });
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

    // Process repo with AI
    const wikiData = await processRepositoryWithAI(repository, files);

    // Cache results for future use
    await cacheAnalysis(cacheKey, wikiData);

    // Return success with redirect URL
    return NextResponse.json({
      success: true,
      redirectUrl: `/repo/${cacheKey}`,
    } as AnalysisResponse);
  } catch (error) {
    console.error("Analysis error:", error);

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

    if (errorMessage.includes("AI processing failed")) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to analyze repository with AI. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
