interface InsightsDashboardProps {
  insights: {
    dependencies: Array<{
      name: string;
      type: "internal" | "external";
      count: number;
    }>;
    testCoverage: {
      percentage: number;
      testedFiles: number;
      totalFiles: number;
      testFiles: string[];
    };
  };
}

export default function InsightsDashboard({
  insights,
}: InsightsDashboardProps) {
  const { dependencies, testCoverage } = insights;

  // Separate external and internal dependencies
  const externalDeps = dependencies.filter((dep) => dep.type === "external");
  const internalDeps = dependencies.filter((dep) => dep.type === "internal");

  // Get max count for scaling bars
  const maxCount = Math.max(...dependencies.map((dep) => dep.count), 1);

  return (
    <div className="space-y-6">
      {/* Test Coverage Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
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
            Test Coverage Estimate
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
            <p className="text-sm text-gray-400">Estimated Coverage</p>
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
              <span className="text-sm text-gray-400">Estimated Tested</span>
              <span className="text-lg font-semibold text-green-400">
                {testCoverage.testedFiles}
              </span>
            </div>
          </div>

          {/* Test Files List */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Test Files Found</p>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {testCoverage.testFiles.length > 0 ? (
                testCoverage.testFiles.slice(0, 3).map((file, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-gray-300 bg-gray-700 px-2 py-1 rounded"
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
      </div>

      {/* Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* External Dependencies */}
        {externalDeps.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
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
              <h3 className="text-lg font-bold text-gray-100">
                External Dependencies
              </h3>
            </div>
            <div className="space-y-3">
              {externalDeps.slice(0, 8).map((dep, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-mono text-gray-300">
                        {dep.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dep.count} imports
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(dep.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internal Dependencies */}
        {internalDeps.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-100">
                Internal Modules
              </h3>
            </div>
            <div className="space-y-3">
              {internalDeps.slice(0, 8).map((dep, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-mono text-gray-300">
                        {dep.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dep.count} imports
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(dep.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-900 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-100">Project Insights</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {externalDeps.length}
            </div>
            <div className="text-sm text-gray-400">External Deps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {internalDeps.length}
            </div>
            <div className="text-sm text-gray-400">Internal Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {testCoverage.testFiles.length}
            </div>
            <div className="text-sm text-gray-400">Test Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {Math.round(
                (internalDeps.length / Math.max(testCoverage.totalFiles, 1)) *
                  100
              )}
              %
            </div>
            <div className="text-sm text-gray-400">Module Coupling</div>
          </div>
        </div>
      </div>
    </div>
  );
}
