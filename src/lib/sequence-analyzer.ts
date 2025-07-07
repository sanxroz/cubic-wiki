import { RepositoryFile, GitHubRepository, SequenceDiagram } from "./types";
import { SubsystemAnalysis } from "./subsystem-analyzer";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AISequenceDiagramSchema = z.object({
  diagrams: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      scenario: z.string(),
      mermaidSyntax: z.string(),
      relatedFiles: z.array(z.string()),
      subsystems: z.array(z.string()),
    })
  ),
});

function getSequenceDiagramJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      diagrams: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            scenario: { type: "string" },
            mermaidSyntax: { type: "string" },
            relatedFiles: { type: "array", items: { type: "string" } },
            subsystems: { type: "array", items: { type: "string" } },
          },
          required: [
            "title",
            "description",
            "scenario",
            "mermaidSyntax",
            "relatedFiles",
            "subsystems",
          ],
        },
      },
    },
    required: ["diagrams"],
  };
}

export async function analyzeSequenceFlows(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis
): Promise<SequenceDiagram[]> {
  try {
    return await generateSequenceDiagramsWithAI(
      repository,
      files,
      subsystemAnalysis
    );
  } catch (error) {
    console.warn("AI sequence generation failed, using fallback:", error);
    return [];
  }
}

async function generateSequenceDiagramsWithAI(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis
): Promise<SequenceDiagram[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = createSequenceAnalysisPrompt(
    repository,
    files,
    subsystemAnalysis
  );

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
        name: "sequence_diagrams",
        schema: getSequenceDiagramJsonSchema(),
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No sequence diagram analysis received from OpenAI");
  }

  const aiResponse = AISequenceDiagramSchema.parse(JSON.parse(content));

  return aiResponse.diagrams;
}

function createSequenceAnalysisPrompt(
  repository: GitHubRepository,
  files: RepositoryFile[],
  subsystemAnalysis: SubsystemAnalysis
): string {
  const projectType = subsystemAnalysis.projectType;
  const subsystemInfo =
    subsystemAnalysis.subsystems.length > 0
      ? `\n**Detected Subsystems:**\n${subsystemAnalysis.subsystems
          .map((s) => `- **${s.name}** (${s.type}): ${s.description}`)
          .join("\n")}`
      : "";

  const fileAnalysis = files
    .slice(0, 20) // Limit to first 20 files to stay within token limits
    .map(
      (file) =>
        `### ${file.path} (${file.type})\n\`\`\`${
          file.type
        }\n${file.content.substring(0, 800)}${
          file.content.length > 800 ? "\n... (truncated)" : ""
        }\n\`\`\``
    )
    .join("\n\n");

  return `You are a software architect analyzing a ${projectType} codebase. Generate 3-5 sequence diagrams for the most important user flows and system interactions.

**Repository:** ${repository.full_name}
**Description:** ${repository.description || "No description provided"}
**Project Type:** ${projectType}${subsystemInfo}

**Code Analysis Instructions:**
1. **Analyze ACTUAL code** - Look at real imports, function calls, API routes, and component relationships
2. **Identify REAL user flows** - Based on actual routes, components, and business logic found in the code
3. **Use SPECIFIC participants** - Use actual component names, service names, and file names from the codebase
4. **Include ERROR handling** - Look for try/catch blocks and error handling patterns in the code
5. **Show DATA flow** - Trace how data actually moves through the system based on the code

**Files to Analyze:**
${fileAnalysis}

**Requirements for Each Diagram:**
- **title**: Descriptive name based on actual functionality (e.g., "User Authentication via JWT", "Product Data Fetching Flow")
- **description**: What the flow accomplishes in this specific codebase
- **scenario**: Type of flow (e.g., "Authentication", "Data Fetching", "File Upload", "Error Handling")
- **mermaidSyntax**: Valid Mermaid sequence diagram syntax using actual component/service names from the code
- **relatedFiles**: Array of actual file paths that are involved in this flow
- **subsystems**: Which subsystems from the detected list are involved

**Mermaid Syntax Guidelines:**
- Use participant names that match actual files/components (e.g., "LoginForm as components/LoginForm.tsx")
- Show actual API endpoints found in the code (e.g., "/api/auth/login")
- Include real database operations if detected (e.g., "Database as Prisma Client")
- Use proper sequence diagram syntax with participant declarations and interactions

**Example Output Structure:**
\`\`\`json
{
  "diagrams": [
    {
      "title": "User Login Authentication",
      "description": "Complete user authentication flow from login form to dashboard redirect",
      "scenario": "Authentication",
      "mermaidSyntax": "sequenceDiagram\\n    participant User as User\\n    participant LoginForm as components/LoginForm.tsx\\n    participant AuthAPI as app/api/auth/route.ts\\n    participant Database as Prisma Client\\n    \\n    User->>LoginForm: Enter credentials\\n    LoginForm->>AuthAPI: POST /api/auth/login\\n    AuthAPI->>Database: findUser(email)\\n    Database-->>AuthAPI: User data\\n    AuthAPI-->>LoginForm: JWT token\\n    LoginForm-->>User: Redirect to dashboard",
      "relatedFiles": ["components/LoginForm.tsx", "app/api/auth/route.ts", "lib/auth.ts"],
      "subsystems": ["frontend", "backend", "data"]
    }
  ]
}
\`\`\`

Focus on the most important flows that developers would need to understand to work with this codebase effectively.`;
}
