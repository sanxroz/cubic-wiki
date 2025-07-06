import { NextResponse } from "next/server";
import { getRecentAnalyses } from "@/lib/cache";

export async function GET() {
  try {
    const recentRepos = await getRecentAnalyses();
    return NextResponse.json(recentRepos);
  } catch (error) {
    console.error("Failed to fetch recent repos:", error);
    return NextResponse.json([], { status: 500 });
  }
}
