import { useState, useCallback, useEffect } from "react";
import { TreeNode } from "@/lib/tree-builder";
import { shouldAutoExpand } from "@/lib/utils";

export interface UseTreeExpansionOptions {
  maxAutoExpandLevel?: number;
  persistKey?: string; // Key for localStorage persistence
}

export interface UseTreeExpansionReturn {
  expandedNodes: Set<string>;
  isExpanded: (nodePath: string, level: number) => boolean;
  toggleNode: (nodePath: string, level: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setExpanded: (nodePath: string, expanded: boolean) => void;
}

/**
 * Custom hook for managing tree node expansion state
 */
export function useTreeExpansion(
  tree: TreeNode,
  options: UseTreeExpansionOptions = {}
): UseTreeExpansionReturn {
  const { maxAutoExpandLevel = 2, persistKey } = options;

  // Initialize expanded nodes with auto-expansion logic (server-safe)
  const getAutoExpandedNodes = useCallback(() => {
    const expanded = new Set<string>();

    // Auto-expand based on level
    const collectAutoExpandNodes = (node: TreeNode, level: number) => {
      if (
        shouldAutoExpand(level, maxAutoExpandLevel) &&
        node.children?.length
      ) {
        expanded.add(node.path);
      }
      node.children?.forEach((child) =>
        collectAutoExpandNodes(child, level + 1)
      );
    };

    if (tree.children) {
      tree.children.forEach((child) => collectAutoExpandNodes(child, 0));
    }

    return expanded;
  }, [tree, maxAutoExpandLevel]);

  // Always start with auto-expanded nodes to ensure server/client consistency
  const [expandedNodes, setExpandedNodes] =
    useState<Set<string>>(getAutoExpandedNodes);

  // Load from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    if (persistKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`tree-expansion-${persistKey}`);
        if (saved) {
          const savedPaths = JSON.parse(saved) as string[];
          const savedSet = new Set(savedPaths);
          setExpandedNodes(savedSet);
        }
      } catch (error) {
        console.warn(
          "Failed to load tree expansion state from localStorage:",
          error
        );
      }
    }
  }, [persistKey]);

  // Persist to localStorage when expanded nodes change (only after hydration)
  const persistExpansionState = useCallback(
    (newExpandedNodes: Set<string>) => {
      if (persistKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `tree-expansion-${persistKey}`,
            JSON.stringify(Array.from(newExpandedNodes))
          );
        } catch (error) {
          console.warn(
            "Failed to save tree expansion state to localStorage:",
            error
          );
        }
      }
    },
    [persistKey]
  );

  const isExpanded = useCallback(
    (nodePath: string): boolean => {
      return expandedNodes.has(nodePath);
    },
    [expandedNodes]
  );

  const toggleNode = useCallback(
    (nodePath: string) => {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodePath)) {
          newSet.delete(nodePath);
        } else {
          newSet.add(nodePath);
        }
        persistExpansionState(newSet);
        return newSet;
      });
    },
    [persistExpansionState]
  );

  const setExpanded = useCallback(
    (nodePath: string, expanded: boolean) => {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (expanded) {
          newSet.add(nodePath);
        } else {
          newSet.delete(nodePath);
        }
        persistExpansionState(newSet);
        return newSet;
      });
    },
    [persistExpansionState]
  );

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();

    const collectAllPaths = (node: TreeNode) => {
      if (node.children?.length) {
        allPaths.add(node.path);
        node.children.forEach(collectAllPaths);
      }
    };

    if (tree.children) {
      tree.children.forEach(collectAllPaths);
    }

    setExpandedNodes(allPaths);
    persistExpansionState(allPaths);
  }, [tree, persistExpansionState]);

  const collapseAll = useCallback(() => {
    const emptySet = new Set<string>();
    setExpandedNodes(emptySet);
    persistExpansionState(emptySet);
  }, [persistExpansionState]);

  return {
    expandedNodes,
    isExpanded,
    toggleNode,
    expandAll,
    collapseAll,
    setExpanded,
  };
}
