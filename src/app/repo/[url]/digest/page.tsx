"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePathname } from "next/navigation";

interface DigestMetadata {
  totalFiles: number;
  totalCharacters: number;
  estimatedTokens: number;
  repository: {
    name: string;
    description: string;
    language: string;
    url: string;
  };
}

interface DigestResponse {
  success: boolean;
  digest?: string;
  metadata?: DigestMetadata;
  error?: string;
}

export default function DigestPage() {
  const params = useParams();
  const pathname = usePathname();
  const [digest, setDigest] = useState<string>("");
  const [metadata, setMetadata] = useState<DigestMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const backToWiki = pathname.replace("/digest", "") as string;

  const generateDigest = useCallback(async () => {
    try {
      setLoading(true);
      const githubUrl = decodeURIComponent(params.url as string);

      const response = await fetch("/api/codebase-digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubUrl }),
      });

      const data: DigestResponse = await response.json();

      if (data.success && data.digest && data.metadata) {
        setDigest(data.digest);
        setMetadata(data.metadata);
      } else {
        setError(data.error || "Failed to generate digest");
      }
    } catch (err) {
      setError("An error occurred while generating the digest");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.url]);

  useEffect(() => {
    generateDigest();
  }, [generateDigest]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([digest], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metadata?.repository.name.replace("/", "-")}-codebase.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Generating codebase digest...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
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
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <a
            href={backToWiki}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href={`${backToWiki}`}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  Prompt-Friendly Codebase
                </h1>
                <p className="text-gray-400">{metadata?.repository.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadAsFile}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </button>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {copied ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights Sidebar */}
          {metadata && (
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">
                  Digest Insights
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Repository</p>
                    <p className="text-white font-medium">
                      {metadata.repository.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Description</p>
                    <p className="text-white text-sm">
                      {metadata.repository.description ||
                        "No description available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Primary Language</p>
                    <p className="text-white font-medium">
                      {metadata.repository.language}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Files</p>
                    <p className="text-white font-medium">
                      {metadata.totalFiles}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Characters</p>
                    <p className="text-white font-medium">
                      {metadata.totalCharacters.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estimated Tokens</p>
                    <p className="text-white font-medium">
                      {metadata.estimatedTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Markdown Content */}
          <div className={metadata ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-gray-800 rounded-lg border border-gray-600">
              <div className="p-4 border-b border-gray-600">
                <h2 className="text-lg font-semibold text-gray-100">
                  Raw Markdown Digest
                </h2>
                <p className="text-gray-400 text-sm">
                  Ready to copy and paste into any LLM
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={digest}
                  readOnly
                  className="w-full h-[600px] bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Generating digest..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
