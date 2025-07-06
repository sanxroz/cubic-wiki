"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentRepo {
  key: string;
  repo: string;
  createdAt: string;
}

export default function RecentRepos() {
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentRepos() {
      try {
        const response = await fetch("/api/recent-repos");
        const repos = await response.json();
        setRecentRepos(repos);
      } catch (error) {
        console.error("Failed to fetch recent repos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentRepos();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400">
        Loading recent analyses...
      </div>
    );
  }

  if (recentRepos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 text-center">
        Recent Analyses
      </h2>
      <div className="space-y-3">
        {recentRepos.map((repo) => (
          <div
            key={repo.key}
            className="bg-gray-800 border border-gray-600 p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-gray-100 font-medium">{repo.repo}</h3>
                <p className="text-gray-400 text-sm">
                  Analyzed on {repo.createdAt}
                </p>
              </div>
              <Link
                href={`/repo/${repo.key}`}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View Analysis →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
