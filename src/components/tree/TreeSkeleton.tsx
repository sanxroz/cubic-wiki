import React from "react";

interface TreeSkeletonProps {
  lines?: number;
}

export const TreeSkeleton: React.FC<TreeSkeletonProps> = ({ lines = 8 }) => {
  return (
    <div className="bg-gray-700  border border-gray-600 p-3 overflow-x-auto">
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 animate-pulse"
          >
            <div className="w-4 h-4 bg-gray-600 "></div>
            <div className="w-4 h-4 bg-gray-600 "></div>
            <div
              className="h-4 bg-gray-600 "
              style={{
                width: `${Math.random() * 200 + 100}px`,
                marginLeft: `${(index % 3) * 20}px`,
              }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TreeLoadingState: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-gray-600  p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span>📁</span>
          <div className="h-6 w-32 bg-gray-600  animate-pulse"></div>
        </div>
        <div className="h-8 w-20 bg-gray-600  animate-pulse"></div>
      </div>

      <TreeSkeleton lines={12} />

      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 bg-gray-600  animate-pulse"></div>
        <div className="h-3 w-1/2 bg-gray-600  animate-pulse"></div>
      </div>
    </div>
  );
};
