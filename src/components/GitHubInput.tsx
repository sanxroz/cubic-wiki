"use client";

import { useState, useEffect } from "react";
import { AnalysisResponse } from "@/lib/types";

interface LoadingStep {
  step: string;
  description: string;
  completed: boolean;
}

const LOADING_STEPS: LoadingStep[] = [
  {
    step: "validate",
    description: "Validating repository URL",
    completed: false,
  },
  {
    step: "fetch",
    description: "Fetching repository information",
    completed: false,
  },
  {
    step: "analyze",
    description: "Analyzing code structure",
    completed: false,
  },
  {
    step: "generate",
    description: "Generating wiki documentation",
    completed: false,
  },
];

export default function GitHubInput() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loadingSteps, setLoadingSteps] = useState(LOADING_STEPS);
  const [currentStep, setCurrentStep] = useState(0);

  // Real-time URL validation
  useEffect(() => {
    if (!url.trim()) {
      setValidationError("");
      return;
    }

    const githubUrlPattern =
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

    if (!githubUrlPattern.test(url.trim())) {
      setValidationError(
        "Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)"
      );
    } else {
      setValidationError("");
    }
  }, [url]);

  // Simulate loading progress
  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          setLoadingSteps((steps) =>
            steps.map((step, index) => ({
              ...step,
              completed: index <= prev,
            }))
          );
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isLoading, loadingSteps.length]);

  const sanitizeUrl = (input: string): string => {
    // Remove any potential harmful characters and normalize
    return input.trim().replace(/[<>]/g, "");
  };

  const isValidGitHubUrl = (input: string): boolean => {
    const githubUrlPattern =
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(input);
  };

  const resetLoadingState = () => {
    setLoadingSteps(
      LOADING_STEPS.map((step) => ({ ...step, completed: false }))
    );
    setCurrentStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedUrl = sanitizeUrl(url);

    if (!sanitizedUrl) return;

    if (!isValidGitHubUrl(sanitizedUrl)) {
      setValidationError("Please enter a valid GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setValidationError("");
    resetLoadingState();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubUrl: sanitizedUrl }),
      });

      const data: AnalysisResponse = await response.json();

      if (data.success) {
        // Complete all steps before redirect
        setLoadingSteps((steps) =>
          steps.map((step) => ({ ...step, completed: true }))
        );

        // Small delay to show complete state
        setTimeout(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            setError("Analysis completed but no redirect URL was provided");
          }
        }, 500);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = url.trim() && !validationError && !isLoading;

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="github-url"
            className="block text-sm font-medium text-gray-300"
          >
            GitHub Repository URL
          </label>
          <div className="relative">
            <input
              id="github-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className={`w-full px-4 py-3 bg-gray-700 border text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                validationError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-blue-500"
              }`}
              disabled={isLoading}
              required
            />
            {url.trim() && !validationError && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-green-400"
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
              </div>
            )}
          </div>

          {validationError && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              {validationError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-blue-600 text-white py-3 px-6 font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
              <span>Analyzing Repository...</span>
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

      {/* Loading Progress */}
      {isLoading && (
        <div className="bg-gray-700 border border-gray-600 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-100">
              Processing Repository
            </h3>
          </div>

          <div className="space-y-3">
            {loadingSteps.map((step, index) => (
              <div key={step.step} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    step.completed
                      ? "bg-green-600"
                      : index === currentStep
                      ? "bg-blue-600"
                      : "bg-gray-600"
                  }`}
                >
                  {step.completed ? (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : index === currentStep ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    step.completed
                      ? "text-green-400"
                      : index === currentStep
                      ? "text-blue-400"
                      : "text-gray-400"
                  }`}
                >
                  {step.description}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-600 rounded-full h-2 mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / loadingSteps.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900 border border-red-700 text-red-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
