"use client";

import { useState } from "react";
import { AnalysisResponse } from "@/lib/types";

interface GitHubInputProps {
  onAnalysisStart?: () => void;
}

export default function GitHubInput({ onAnalysisStart }: GitHubInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");

    if (onAnalysisStart) {
      onAnalysisStart();
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubUrl: url.trim() }),
      });

      const data: AnalysisResponse = await response.json();

      if (data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          setError("Analysis completed but no redirect URL was provided");
        }
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidGitHubUrl = (url: string) => {
    return /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?(?:\/.*)?(?:\?.*)?$/.test(
      url
    );
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="github-url"
            className="block text-sm font-medium text-gray-300"
          >
            GitHub Repository URL
          </label>
          <input
            id="github-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full px-4 py-3 border border-gray-600 bg-gray-800 text-white  focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-colors placeholder-gray-400"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 text-sm p-3 ">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isValidGitHubUrl(url)}
          className="w-full bg-blue-600 text-white py-3 px-6  font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Analyze Repository</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
