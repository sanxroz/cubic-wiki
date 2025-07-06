import React from "react";

interface TreeControlsProps {
  showStats: boolean;
  onToggleStats: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const TreeControls: React.FC<TreeControlsProps> = React.memo(
  ({ showStats, onToggleStats, onExpandAll, onCollapseAll }) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <span>📁</span>
          Project Structure
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={onExpandAll}
            className="text-xs text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 px-2 py-1  border border-gray-600 hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-1 focus:ring-offset-gray-800"
            aria-label="Expand all directories"
          >
            Expand All
          </button>

          <button
            onClick={onCollapseAll}
            className="text-xs text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 px-2 py-1  border border-gray-600 hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-1 focus:ring-offset-gray-800"
            aria-label="Collapse all directories"
          >
            Collapse All
          </button>

          <button
            onClick={onToggleStats}
            className="text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 px-2 py-1  border border-gray-600 hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-1 focus:ring-offset-gray-800"
            aria-label={showStats ? "Hide statistics" : "Show statistics"}
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
        </div>
      </div>
    );
  }
);

TreeControls.displayName = "TreeControls";
