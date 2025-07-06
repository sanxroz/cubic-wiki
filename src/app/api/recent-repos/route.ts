import { NextRequest, NextResponse } from "next/server";
import { getRecentAnalyses, deleteCachedAnalysis } from "@/lib/cache";

export async function GET() {
  try {
    const recentRepos = await getRecentAnalyses();
    return NextResponse.json(recentRepos);
  } catch (error) {
    console.error("Failed to fetch recent repos:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = searchParams.get("key");

    if (!cacheKey) {
      return NextResponse.json(
        { success: false, error: "Cache key is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteCachedAnalysis(cacheKey);

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to delete analysis" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to delete recent repo:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
