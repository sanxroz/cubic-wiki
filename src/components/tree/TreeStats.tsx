import React from 'react';

interface TreeStatsProps {
  totalFiles: number;
  totalDirectories: number;
  isVisible: boolean;
}

export const TreeStats: React.FC<TreeStatsProps> = React.memo(({
  totalFiles,
  totalDirectories,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-gray-300">Files:</span>
          <span className="ml-2 font-semibold text-gray-100">
            {totalFiles.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-300">Directories:</span>
          <span className="ml-2 font-semibold text-gray-100">
            {totalDirectories.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});

TreeStats.displayName = 'TreeStats';
