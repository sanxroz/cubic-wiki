interface InsightsDashboardProps {
  insights: {
    dependencies: Array<{
      name: string;
      count: number;
    }>;
    testCoverage: {
      percentage: number;
      testedFiles: number;
      totalFiles: number;
      testFiles: string[];
      testFramework?: string;
      untestedFiles: string[];
      testToSourceMapping: Record<string, string[]>;
      qualityMetrics: {
        avgTestFileSize: number;
        testToSourceRatio: number;
      };
    };
  };
}

export default function InsightsDashboard({
  insights,
}: InsightsDashboardProps) {
  const { dependencies, testCoverage } = insights;

  return (
    <div className="space-y-6">
      {/* Test Coverage Overview */}
      <div className="bg-gray-800  border border-gray-600 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-900  flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-100">
            Test Coverage Analysis
            {testCoverage.testFramework && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({testCoverage.testFramework})
              </span>
            )}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coverage Percentage */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-600"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 10 * (1 - testCoverage.percentage / 100)
                  }`}
                  className={`${
                    testCoverage.percentage >= 80
                      ? "text-green-400"
                      : testCoverage.percentage >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-100">
                  {testCoverage.percentage}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {Object.keys(testCoverage.testToSourceMapping).length > 0
                ? "Actual Coverage"
                : "Estimated Coverage"}
            </p>
          </div>

          {/* File Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Source Files</span>
              <span className="text-lg font-semibold text-gray-100">
                {testCoverage.totalFiles}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Test Files</span>
              <span className="text-lg font-semibold text-blue-400">
                {testCoverage.testFiles.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {Object.keys(testCoverage.testToSourceMapping).length > 0
                  ? "Tested Files"
                  : "Estimated Tested"}
              </span>
              <span className="text-lg font-semibold text-green-400">
                {testCoverage.testedFiles}
              </span>
            </div>
            {testCoverage.qualityMetrics && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Test/Source Ratio</span>
                <span className="text-lg font-semibold text-yellow-400">
                  {testCoverage.qualityMetrics?.testToSourceRatio}
                </span>
              </div>
            )}
          </div>

          {/* Test Files List */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Test Files Found</p>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {testCoverage.testFiles.length > 0 ? (
                testCoverage.testFiles.slice(0, 3).map((file, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-gray-300 bg-gray-700 px-2 py-1 "
                  >
                    {file.split("/").pop()}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 italic">
                  No test files detected
                </div>
              )}
              {testCoverage.testFiles.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{testCoverage.testFiles.length - 3} more...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Untested Files Section */}
        {testCoverage.untestedFiles &&
          testCoverage.untestedFiles.length > 0 && (
            <div className="mt-6 bg-red-900/20 border border-red-700  p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 text-red-400"
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
                <h4 className="font-semibold text-red-400">
                  Coverage Gaps ({testCoverage.untestedFiles.length} files)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {testCoverage.untestedFiles.slice(0, 10).map((file, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-red-300 bg-red-900/30 px-2 py-1  border border-red-800"
                  >
                    {file}
                  </div>
                ))}
              </div>
              {testCoverage.untestedFiles.length > 10 && (
                <div className="text-xs text-red-400 mt-2 text-center">
                  +{testCoverage.untestedFiles.length - 10} more untested files
                </div>
              )}
            </div>
          )}
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div className="bg-gray-800  border border-gray-600 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-900  flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-100">Dependencies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dependencies.slice(0, 12).map((dep, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 bg-gray-700  border border-gray-600"
              >
                <div className="w-2 h-2 bg-blue-400 flex-shrink-0"></div>
                <span className="text-sm font-mono text-gray-300 flex-1">
                  {dep.name}
                </span>
              </div>
            ))}
            {dependencies.length > 12 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                +{dependencies.length - 12} more dependencies
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
