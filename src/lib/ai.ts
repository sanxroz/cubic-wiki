import OpenAI from "openai";
import { z } from "zod";
import {
  RepositoryFile,
  GitHubRepository,
  WikiData,
  WikiSection,
  SequenceDiagram,
} from "./types";
import { analyzeSubsystems, SubsystemAnalysis } from "./subsystem-analyzer";
import { buildProjectTree, ProjectTree } from "./tree-builder";
import { analyzeInsights, InsightsData } from "./insights-analyzer";
import { analyzeSequenceFlows } from "./sequence-analyzer";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required but not set"
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schemas for structured outputs
const CitationSchema = z.object({
  text: z.string(),
  file: z.string(),
  url: z.string(),
});

const WikiSectionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  keyTakeaways: z.array(z.string()),
  files: z.array(z.string()),
  citations: z.array(CitationSchema),
});

const ArchitectureSchema = z.object({
  summary: z.string(),
  style: z.string(),
  patterns: z.array(z.string()),
  technologies: z.array(z.string()),
  dataFlow: z.string(),
  keyDecisions: z.array(z.string()),
});

const AIResponseSchema = z.object({
  overview: z.string(),
  architecture: ArchitectureSchema,
  sections: z.array(WikiSectionSchema),
});

// Convert Zod schema to JSON schema for OpenAI
function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  // Simple conversion for our specific schemas
  if (schema === AIResponseSchema) {
    return {
      type: "object",
      properties: {
        overview: { type: "string" },
        architecture: {
          type: "object",
          properties: {
            summary: { type: "string" },
            style: { type: "string" },
            patterns: { type: "array", items: { type: "string" } },
            technologies: { type: "array", items: { type: "string" } },
            dataFlow: { type: "string" },
            keyDecisions: { type: "array", items: { type: "string" } },
          },
          required: [
            "summary",
            "style",
            "patterns",
            "technologies",
            "dataFlow",
            "keyDecisions",
          ],
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              content: { type: "string" },
              keyTakeaways: { type: "array", items: { type: "string" } },
              files: { type: "array", items: { type: "string" } },
              citations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    file: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["text", "file", "url"],
                },
              },
            },
            required: [
              "title",
              "summary",
              "content",
              "keyTakeaways",
              "files",
              "citations",
            ],
          },
        },
      },
      required: ["overview", "architecture", "sections"],
    };
  }
  throw new Error("Unsupported schema");
}

export async function processRepositoryWithAI(
  repository: GitHubRepository,
  files: RepositoryFile[]
): Promise<WikiData> {
  // Analyze subsystems programmatically
  const subsystemAnalysis = analyzeSubsystems(repository, files);

  // Build project tree with subsystem information
  const projectTree = buildProjectTree(files, subsystemAnalysis.subsystems);

  // Generate insights
  const insights = analyzeInsights(files);

  // Generate sequence diagrams
  const sequenceDiagrams = await analyzeSequenceFlows(
    repository,
    files,
    subsystemAnalysis
  );

  // Create prompt
  const prompt = createAnalysisPrompt(repository, files, subsystemAnalysis);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "repository_analysis",
          schema: zodToJsonSchema(AIResponseSchema),
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis result received from OpenAI");
    }

    // Parse with Zod validation
    const aiResponse = AIResponseSchema.parse(JSON.parse(content));

    // Convert to WikiData format
    return createWikiData(
      repository,
      aiResponse,
      projectTree,
      subsystemAnalysis,
      insights,
      sequenceDiagrams
    );
  } catch (error) {
    console.warn("AI processing failed, creating fallback structure:", error);
    return createFallbackWikiData(
      repository,
      files,
      subsystemAnalysis,
      projectTree,
      insights,
      sequenceDiagrams
    );
  }
}

function createAnalysisPrompt(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis
): string {
  const fileListings = files
    .map(
      (file) =>
        `### ${file.path} (${file.type})\n\`\`\`${
          file.type
        }\n${file.content.substring(0, 1500)}${
          file.content.length > 1500 ? "\n... (truncated)" : ""
        }\n\`\`\``
    )
    .join("\n\n");

  const subsystemContext =
    subsystemAnalysis.subsystems.length > 0
      ? `\n**Detected Subsystems:**\n${subsystemAnalysis.subsystems
          .map((s) => `- **${s.name}** (${s.type}): ${s.description}`)
          .join("\n")}\n\n**Project Type**: ${subsystemAnalysis.projectType}\n`
      : "";

  const dependencyCount = files.filter(
    (f) =>
      f.path.includes("package.json") ||
      f.path.includes("requirements.txt") ||
      f.path.includes("go.mod") ||
      f.path.includes("Cargo.toml")
  ).length;

  const testFiles = files.filter(
    (f) =>
      f.path.includes("test") ||
      f.path.includes("spec") ||
      f.path.includes("__tests__")
  ).length;

  return `You are an expert technical documentation writer. Analyze this ${
    repository.language || "code"
  } repository and create comprehensive, developer-friendly documentation.

**Repository**: ${repository.full_name}
**Description**: ${repository.description || "No description provided"}
**Files Analyzed**: ${files.length} files
**Test Files**: ${testFiles} files
**Manifest Files**: ${dependencyCount} files
${subsystemContext}

**Files:**
${fileListings}

Create detailed, structured documentation following this EXACT format:

## Overview
Write a compelling 2-3 sentence executive summary explaining what this repository does and why it matters. Focus on the main purpose and value proposition.

## Architecture  
Provide structured architectural information with these specific fields:
- **summary**: 2-3 sentence overview of the architectural approach
- **style**: High-level architecture style (e.g., "Microservices", "Monolithic MVC", "JAMStack", "Serverless")
- **patterns**: Array of key design patterns used (e.g., "MVC", "Repository Pattern", "Observer Pattern")
- **technologies**: Array of core technologies and frameworks (e.g., "React", "Node.js", "PostgreSQL", "Redis")
- **dataFlow**: Description of how data flows through the system
- **keyDecisions**: Array of important architectural decisions and their reasoning

## Sections
For each major component/subsystem, create sections with this structure:

### Section Format:
- **title**: Clear, descriptive name (e.g., "Authentication System", "API Layer", "Frontend Components")
- **summary**: One concise sentence describing what this component does
- **content**: Detailed explanation including:
  • Purpose and responsibilities
  • How it works technically
  • Key files and their roles
  • Integration points with other components
  • Any notable patterns or approaches
- **keyTakeaways**: 3-5 bullet points with specific, actionable insights like:
  • Technical implementation details
  • Important configuration or setup notes
  • Performance considerations
  • Security features
  • Developer workflow tips
- **files**: List of relevant file paths for this component
- **citations**: For each important file, include:
  • text: Brief description of what this file does and why it's important
  • file: The file path
  • url: GitHub URL to the file

## Requirements:
1. **Be specific and technical** - include actual implementation details, not generic descriptions
2. **Use bullet points liberally** - make content scannable and actionable
3. **Explain WHY, not just WHAT** - include reasoning behind architectural decisions
4. **Include practical details** - setup steps, configuration notes, common patterns
5. **Make citations meaningful** - explain why each file matters to developers
6. **Focus on developer experience** - what would help someone understand and work with this code

## Examples of Good Content:
❌ Bad: "This handles authentication"
✅ Good: "JWT-based authentication system using HTTP-only cookies for security, with role-based access control and session management via Redis"

❌ Bad: "Configuration file"  
✅ Good: "Next.js configuration enabling TypeScript strict mode, custom webpack bundling for optimal performance, and API route middleware setup"

Create documentation that helps developers quickly understand the codebase structure, make contributions, and avoid common pitfalls.`;
}

function createWikiData(
  repository: GitHubRepository,
  aiResponse: z.infer<typeof AIResponseSchema>,
  projectTree: ProjectTree,
  subsystemAnalysis: SubsystemAnalysis,
  insights: InsightsData,
  sequenceDiagrams: SequenceDiagram[]
): WikiData {
  const sections: WikiSection[] = aiResponse.sections.map((section) => ({
    title: section.title,
    summary: section.summary,
    content: section.content,
    keyTakeaways: section.keyTakeaways,
    files: section.files,
    citations: section.citations.map((citation) => ({
      text: citation.text,
      file: citation.file,
      url:
        citation.url ||
        `${repository.html_url}/blob/${repository.default_branch}/${citation.file}`,
    })),
  }));

  return {
    githubUrl: repository.html_url,
    generatedAt: new Date().toISOString(),
    repository,
    wiki: {
      overview: aiResponse.overview,
      architecture: aiResponse.architecture,
      sections,
    },
    projectTree,
    subsystemAnalysis,
    sequenceDiagrams,
    insights,
  };
}

// Fallback when AI fails
function createFallbackWikiData(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis,
  projectTree: ProjectTree,
  insights: InsightsData,
  sequenceDiagrams: SequenceDiagram[]
): WikiData {
  const fallbackSections: WikiSection[] =
    subsystemAnalysis.subsystems.length > 0
      ? subsystemAnalysis.subsystems.map((subsystem) => ({
          title: subsystem.name,
          summary: `${subsystem.type} subsystem with ${subsystem.files.length} files`,
          content: `${subsystem.description} (Detected with ${(
            subsystem.confidence * 100
          ).toFixed(0)}% confidence)`,
          keyTakeaways: [
            `Contains ${subsystem.files.length} files`,
            `Confidence level: ${(subsystem.confidence * 100).toFixed(0)}%`,
            `Type: ${subsystem.type}`,
          ],
          files: subsystem.files,
          citations: subsystem.files.slice(0, 3).map((file) => ({
            text: `${subsystem.type} file`,
            file,
            url: `${repository.html_url}/blob/${repository.default_branch}/${file}`,
          })),
        }))
      : [
          {
            title: "Source Files",
            summary: `Repository contains ${files.length} source files`,
            content: "The following files were found in this repository.",
            keyTakeaways: [
              `Total files: ${files.length}`,
              "Programmatically detected file structure",
              "No specific subsystems identified",
            ],
            files: files.map((f) => f.path),
            citations: files.slice(0, 5).map((file) => ({
              text: `${file.type} file`,
              file: file.path,
              url: `${repository.html_url}/blob/${repository.default_branch}/${file.path}`,
            })),
          },
        ];

  return {
    githubUrl: repository.html_url,
    generatedAt: new Date().toISOString(),
    repository,
    wiki: {
      overview: `This is a ${subsystemAnalysis.projectType}: ${
        repository.description || repository.name
      }`,
      architecture: {
        summary: `${subsystemAnalysis.projectType}. AI analysis could not be completed, but programmatic analysis detected the architectural structure.`,
        style: "Custom Architecture",
        patterns: ["File-based detection"],
        technologies: [repository.language || "Unknown"].filter(Boolean),
        dataFlow: "Unable to determine data flow without AI analysis.",
        keyDecisions: [
          "Programmatically detected architecture based on file patterns",
          "Limited analysis due to AI processing failure",
        ],
      },
      sections: fallbackSections,
    },
    projectTree,
    subsystemAnalysis,
    sequenceDiagrams,
    insights,
  };
}
