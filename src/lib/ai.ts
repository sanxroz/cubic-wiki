import OpenAI from "openai";
import { z } from "zod";
import {
  RepositoryFile,
  GitHubRepository,
  WikiData,
  WikiSection,
} from "./types";
import { analyzeSubsystems, SubsystemAnalysis } from "./subsystem-analyzer";
import { buildProjectTree, ProjectTree } from "./tree-builder";
import { analyzeInsights, InsightsData } from "./insights-analyzer";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required but not set"
  );
}

const DEVELOPMENT = process.env.NODE_ENV === "development";

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
  content: z.string(),
  files: z.array(z.string()),
  citations: z.array(CitationSchema),
});

const AIResponseSchema = z.object({
  overview: z.string(),
  architecture: z.string(),
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
        architecture: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
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
            required: ["title", "content", "files", "citations"],
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
  // Step 1: Analyze subsystems programmatically
  const subsystemAnalysis = analyzeSubsystems(repository, files);

  // Step 2: Build project tree with subsystem information
  const projectTree = buildProjectTree(files, subsystemAnalysis.subsystems);

  // Step 3: Generate insights
  const insights = analyzeInsights(files);

  // Step 4: Create clean, focused prompt
  const prompt = createAnalysisPrompt(repository, files, subsystemAnalysis);

  try {
    if (DEVELOPMENT) {
      console.log("Analysis prompt:", prompt);
    }

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
      insights
    );
  } catch (error) {
    console.warn("AI processing failed, creating fallback structure:", error);
    return createFallbackWikiData(
      repository,
      files,
      subsystemAnalysis,
      projectTree,
      insights
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
          .join("\n")}\n\n**Architecture**: ${subsystemAnalysis.architecture}\n`
      : "";

  return `Analyze this ${
    repository.language || "code"
  } repository and provide comprehensive documentation.

**Repository**: ${repository.full_name}
**Description**: ${repository.description || "No description provided"}
${subsystemContext}

**Files:**
${fileListings}

Create structured documentation with:
1. **Overview**: What the repository does and its key features
2. **Architecture**: Technical approach, patterns, and design decisions
3. **Sections**: Organize into logical components/subsystems with:
   - Clear titles for each major component
   - Detailed explanations of functionality
   - Relevant file paths for each section
   - Citations with descriptions, file paths, and GitHub URLs

Focus on technical accuracy and clear explanations that help developers understand the codebase structure and functionality.`;
}

function createWikiData(
  repository: GitHubRepository,
  aiResponse: z.infer<typeof AIResponseSchema>,
  projectTree: ProjectTree,
  subsystemAnalysis: SubsystemAnalysis,
  insights: InsightsData
): WikiData {
  const sections: WikiSection[] = aiResponse.sections.map((section) => ({
    title: section.title,
    content: section.content,
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
    insights,
  };
}

function createFallbackWikiData(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis,
  projectTree: ProjectTree,
  insights: InsightsData
): WikiData {
  const fallbackSections: WikiSection[] =
    subsystemAnalysis.subsystems.length > 0
      ? subsystemAnalysis.subsystems.map((subsystem) => ({
          title: subsystem.name,
          content: `${subsystem.description} (Detected with ${(
            subsystem.confidence * 100
          ).toFixed(0)}% confidence)`,
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
            content: "The following files were found in this repository.",
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
      architecture: `${subsystemAnalysis.architecture}. AI analysis could not be completed, but programmatic analysis detected the architectural structure.`,
      sections: fallbackSections,
    },
    projectTree,
    subsystemAnalysis,
    insights,
  };
}
