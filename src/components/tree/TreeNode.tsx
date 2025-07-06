import React, { useMemo, useCallback, useRef } from "react";
import {
  TreeNode as TreeNodeType,
  getDirectoryIcon,
  getFileIcon,
} from "@/lib/tree-builder";
import { formatFileSize, getTreeConnector, getChildPrefix } from "@/lib/utils";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  isLast: boolean;
  prefix: string;
  repositoryUrl: string;
  defaultBranch: string;
  isExpanded: (nodePath: string, level: number) => boolean;
  onToggle: (nodePath: string, level: number) => void;
  onKeyDown?: (
    event: React.KeyboardEvent,
    nodePath: string,
    level: number
  ) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = React.memo(
  ({
    node,
    level,
    isLast,
    prefix,
    repositoryUrl,
    defaultBranch,
    isExpanded,
    onToggle,
    onKeyDown,
  }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const hasChildren = useMemo(
      () => node.children && node.children.length > 0,
      [node.children]
    );

    const nodeIsExpanded = useMemo(
      () => isExpanded(node.path, level),
      [isExpanded, node.path, level]
    );

    const connector = useMemo(() => getTreeConnector(isLast), [isLast]);

    const icon = useMemo(
      () =>
        node.type === "directory"
          ? getDirectoryIcon(node.name, node.subsystemType)
          : getFileIcon(node.fileType || "", node.name),
      [node.type, node.name, node.subsystemType, node.fileType]
    );

    const fileUrl = useMemo(
      () => `${repositoryUrl}/blob/${defaultBranch}/${node.path}`,
      [repositoryUrl, defaultBranch, node.path]
    );

    const handleToggle = useCallback(() => {
      if (hasChildren) {
        onToggle(node.path, level);
      }
    }, [hasChildren, onToggle, node.path, level]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (onKeyDown) {
          onKeyDown(event, node.path, level);
        }

        // Handle basic keyboard navigation
        switch (event.key) {
          case "Enter":
          case " ":
            if (hasChildren) {
              event.preventDefault();
              handleToggle();
            }
            break;
          case "ArrowRight":
            if (hasChildren && !nodeIsExpanded) {
              event.preventDefault();
              handleToggle();
            }
            break;
          case "ArrowLeft":
            if (hasChildren && nodeIsExpanded) {
              event.preventDefault();
              handleToggle();
            }
            break;
        }
      },
      [onKeyDown, node.path, level, hasChildren, nodeIsExpanded, handleToggle]
    );

    const childPrefix = useMemo(
      () => getChildPrefix(prefix, isLast),
      [prefix, isLast]
    );

    return (
      <div className="font-mono text-sm">
        <div className="flex items-center group hover:bg-gray-700/50  px-1 transition-all duration-200 ease-in-out hover:shadow-sm">
          <span className="text-gray-400 select-none" aria-hidden="true">
            {prefix + connector}
          </span>

          <button
            ref={buttonRef}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={`flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ${
              node.type === "file"
                ? "cursor-default"
                : "cursor-pointer hover:bg-gray-600/30"
            }`}
            disabled={node.type === "file"}
            role={node.type === "directory" ? "treeitem" : "none"}
            aria-expanded={
              node.type === "directory" ? nodeIsExpanded : undefined
            }
            aria-label={
              node.type === "directory"
                ? `${node.name} directory, ${
                    nodeIsExpanded ? "expanded" : "collapsed"
                  }`
                : `${node.name} file`
            }
            tabIndex={0}
          >
            {hasChildren && (
              <span
                className="text-gray-400 text-xs w-3 transition-transform duration-200 ease-in-out"
                aria-hidden="true"
                style={{
                  transform: nodeIsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                }}
              >
                ▼
              </span>
            )}
            {!hasChildren && <span className="w-3" aria-hidden="true"></span>}

            <span className="mr-1" aria-hidden="true">
              {icon}
            </span>

            {node.type === "file" ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-1 focus:ring-offset-gray-800 transition-colors duration-150"
                aria-label={`Open ${node.name} in GitHub`}
              >
                {node.name}
              </a>
            ) : (
              <span
                className={`transition-colors duration-150 ${
                  hasChildren
                    ? "text-gray-100 group-hover:text-white"
                    : "text-gray-300"
                }`}
              >
                {node.name}
              </span>
            )}

            {node.subsystemType && (
              <span
                className="ml-2 px-1.5 py-0.5 text-xs bg-blue-900 text-blue-200 "
                aria-label={`Subsystem: ${node.subsystemType}`}
              >
                {node.subsystemType}
              </span>
            )}

            {node.type === "file" && node.size && (
              <span
                className="ml-2 text-xs text-gray-400"
                aria-label={`File size: ${formatFileSize(node.size)}`}
              >
                {formatFileSize(node.size)}
              </span>
            )}
          </button>
        </div>

        {hasChildren && nodeIsExpanded && (
          <div role="group" aria-label={`Contents of ${node.name}`}>
            {node.children!.map((child, index) => {
              const childIsLast = index === node.children!.length - 1;

              return (
                <TreeNode
                  key={child.path}
                  node={child}
                  level={level + 1}
                  isLast={childIsLast}
                  prefix={childPrefix}
                  repositoryUrl={repositoryUrl}
                  defaultBranch={defaultBranch}
                  isExpanded={isExpanded}
                  onToggle={onToggle}
                  onKeyDown={onKeyDown}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

TreeNode.displayName = "TreeNode";
