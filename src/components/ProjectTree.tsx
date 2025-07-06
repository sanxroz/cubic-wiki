"use client";

import { useState } from "react";
import { TreeNode as TreeNodeType } from "@/lib/tree-builder";
import { useTreeExpansion } from "@/hooks/useTreeExpansion";
import { TreeControls } from "./tree/TreeControls";
import { TreeStats } from "./tree/TreeStats";
import { TreeNode } from "./tree/TreeNode";

interface ProjectTreeProps {
  tree: TreeNodeType;
  totalFiles: number;
  totalDirectories: number;
  repositoryUrl: string;
  defaultBranch: string;
}

export default function ProjectTree({
  tree,
  totalFiles,
  totalDirectories,
  repositoryUrl,
  defaultBranch,
}: ProjectTreeProps) {
  const [showStats, setShowStats] = useState(false);

  // Use the tree expansion hook with persistence
  const { isExpanded, toggleNode, expandAll, collapseAll } = useTreeExpansion(
    tree,
    {
      maxAutoExpandLevel: 2,
      persistKey: `project-tree-${repositoryUrl}`,
    }
  );

  return (
    <div className="bg-gray-800 border border-gray-600  p-4">
      <TreeControls
        showStats={showStats}
        onToggleStats={() => setShowStats(!showStats)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      <TreeStats
        totalFiles={totalFiles}
        totalDirectories={totalDirectories}
        isVisible={showStats}
      />

      <div
        className="bg-gray-700  border border-gray-600 p-3 overflow-x-auto"
        role="tree"
        aria-label="Project file tree"
      >
        {tree.children && tree.children.length > 0 ? (
          <div>
            {tree.children.map((child, index) => (
              <TreeNode
                key={child.path}
                node={child}
                level={0}
                isLast={index === tree.children!.length - 1}
                prefix=""
                repositoryUrl={repositoryUrl}
                defaultBranch={defaultBranch}
                isExpanded={isExpanded}
                onToggle={toggleNode}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4">
            No files found in repository
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <p>
          💡 Click on file names to view source code on GitHub. Use keyboard
          navigation (Enter/Space to toggle, Arrow keys to navigate).
        </p>
        {totalFiles > 0 && (
          <p className="mt-1">
            Subsystem badges show architectural components detected by analysis.
          </p>
        )}
      </div>
    </div>
  );
}
