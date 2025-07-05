import { ProjectTree } from "./tree-builder";
import { SubsystemAnalysis } from "./subsystem-analyzer";

export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  html_url: string;
  clone_url: string;
}

export interface RepositoryFile {
  path: string;
  content: string;
  size: number;
  type: string;
}

export interface WikiSection {
  title: string;
  content: string;
  files: string[];
  citations: CitationLink[];
}

export interface CitationLink {
  text: string;
  file: string;
  line?: number;
  url: string;
}

export interface WikiData {
  githubUrl: string;
  generatedAt: string;
  repository: GitHubRepository;
  wiki: {
    overview: string;
    architecture: string;
    sections: WikiSection[];
  };
  projectTree?: ProjectTree;
  subsystemAnalysis?: SubsystemAnalysis;
  insights?: {
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

export interface AnalysisRequest {
  githubUrl: string;
}

export interface AnalysisResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export type {
  SubsystemInfo,
  ArchitecturalPattern,
  SubsystemAnalysis,
} from "./subsystem-analyzer";

// Re-export tree builder types
export type { TreeNode, ProjectTree } from "./tree-builder";
