import { RepositoryFile } from "./types";
import { SubsystemInfo } from "./subsystem-analyzer";

export interface TreeNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: TreeNode[];
  subsystemType?: string;
  fileType?: string;
  size?: number;
}

export interface ProjectTree {
  root: TreeNode;
  totalFiles: number;
  totalDirectories: number;
  maxDepth: number;
}

export function buildProjectTree(
  files: RepositoryFile[],
  subsystems: SubsystemInfo[] = []
): ProjectTree {
  const root: TreeNode = {
    name: "root",
    type: "directory",
    path: "",
    children: [],
  };

  // Create subsystem lookup map
  const subsystemMap = new Map<string, string>();
  subsystems.forEach((subsystem) => {
    subsystem.files.forEach((filePath) => {
      subsystemMap.set(filePath, subsystem.type);
    });
  });

  let totalFiles = 0;
  let totalDirectories = 0;
  let maxDepth = 0;

  // Sort files to ensure consistent tree structure
  const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));

  sortedFiles.forEach((file) => {
    const pathParts = file.path.split("/").filter(Boolean);
    let currentNode = root;

    // Calculate depth
    maxDepth = Math.max(maxDepth, pathParts.length);

    // Build the path
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isFile = i === pathParts.length - 1;
      const currentPath = pathParts.slice(0, i + 1).join("/");

      if (!currentNode.children) {
        currentNode.children = [];
      }

      let existingNode = currentNode.children.find(
        (child) => child.name === part
      );

      if (!existingNode) {
        const newNode: TreeNode = {
          name: part,
          type: isFile ? "file" : "directory",
          path: currentPath,
          subsystemType: subsystemMap.get(currentPath),
          fileType: isFile ? file.type : undefined,
          size: isFile ? file.size : undefined,
        };

        if (!isFile) {
          newNode.children = [];
        }

        currentNode.children.push(newNode);
        existingNode = newNode;

        if (isFile) {
          totalFiles++;
        } else {
          totalDirectories++;
        }
      }

      currentNode = existingNode;
    }
  });

  // Sort children recursively (directories first, then files, both alphabetically)
  sortTreeNode(root);

  return {
    root,
    totalFiles,
    totalDirectories,
    maxDepth,
  };
}

function sortTreeNode(node: TreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  node.children.forEach(sortTreeNode);
}

export function getFileIcon(fileType: string, fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  // File type icons
  const iconMap: Record<string, string> = {
    // Programming languages
    javascript: "📄",
    typescript: "📘",
    python: "🐍",
    java: "☕",
    go: "🐹",
    rust: "🦀",

    // Web files
    html: "🌐",
    css: "🎨",
    scss: "🎨",
    json: "📋",
    yaml: "📝",
    yml: "📝",

    // Framework files
    jsx: "⚛️",
    tsx: "⚛️",
    vue: "💚",
    svelte: "🧡",

    // Documentation
    markdown: "📖",
    md: "📖",
    txt: "📄",

    // Config files
    config: "⚙️",
    env: "🔧",

    // Build/Package files
    dockerfile: "🐳",
    "docker-compose": "🐳",
  };

  if (extension && iconMap[extension]) {
    return iconMap[extension];
  }

  if (fileType && iconMap[fileType]) {
    return iconMap[fileType];
  }

  // Special file names
  const specialFiles: Record<string, string> = {
    "package.json": "📦",
    "readme.md": "📖",
    dockerfile: "🐳",
    "docker-compose.yml": "🐳",
    "docker-compose.yaml": "🐳",
    ".gitignore": "🚫",
    ".env": "🔧",
    ".env.example": "🔧",
    "tsconfig.json": "📘",
    "next.config.js": "▲",
    "next.config.ts": "▲",
  };

  if (specialFiles[fileName.toLowerCase()]) {
    return specialFiles[fileName.toLowerCase()];
  }

  return "📄"; // Default file icon
}

export function getDirectoryIcon(
  dirName: string,
  subsystemType?: string
): string {
  // Subsystem-based icons
  const subsystemIcons: Record<string, string> = {
    frontend: "🖥️",
    backend: "⚙️",
    api: "🔌",
    auth: "🔐",
    data: "🗃️",
    config: "⚙️",
    cli: "💻",
    feature: "🎯",
  };

  if (subsystemType && subsystemIcons[subsystemType]) {
    return subsystemIcons[subsystemType];
  }

  // Directory name-based icons
  const directoryIcons: Record<string, string> = {
    src: "📁",
    app: "📱",
    components: "🧩",
    pages: "📄",
    lib: "📚",
    utils: "🔧",
    api: "🔌",
    public: "🌐",
    static: "🌐",
    assets: "🖼️",
    styles: "🎨",
    css: "🎨",
    images: "🖼️",
    docs: "📖",
    test: "🧪",
    tests: "🧪",
    spec: "🧪",
    dist: "📦",
    build: "🏗️",
    node_modules: "📦",
    ".git": "🔧",
    ".github": "🔧",
    config: "⚙️",
    scripts: "📜",
    bin: "⚡",
    tools: "🛠️",
  };

  return directoryIcons[dirName.toLowerCase()] || "📁";
}

export function renderTreeToString(
  node: TreeNode,
  prefix: string = "",
  isLast: boolean = true,
  isRoot: boolean = true
): string {
  if (isRoot && node.children) {
    return node.children
      .map((child, index) =>
        renderTreeToString(
          child,
          "",
          index === node.children!.length - 1,
          false
        )
      )
      .join("\n");
  }

  const connector = isLast ? "└── " : "├── ";
  const icon =
    node.type === "directory"
      ? getDirectoryIcon(node.name, node.subsystemType)
      : getFileIcon(node.fileType || "", node.name);

  let result = prefix + connector + icon + " " + node.name;

  if (node.subsystemType) {
    result += ` (${node.subsystemType})`;
  }

  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    const childStrings = node.children.map((child, index) =>
      renderTreeToString(
        child,
        childPrefix,
        index === node.children!.length - 1,
        false
      )
    );
    result += "\n" + childStrings.join("\n");
  }

  return result;
}
