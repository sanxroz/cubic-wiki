import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatRequest, ChatResponse } from "@/lib/types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required but not set"
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, messages, repositoryContext } = body;

    if (!message || !repositoryContext) {
      return NextResponse.json(
        {
          success: false,
          error: "Message and repository context are required",
        },
        { status: 400 }
      );
    }

    // Create system prompt with repository context
    const systemPrompt = createSystemPrompt(repositoryContext);

    // Convert chat messages to OpenAI format
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: "system",
          content: systemPrompt,
        },
        // Add previous conversation messages
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        // Add current user message
        {
          role: "user" as const,
          content: message,
        },
      ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { success: false, error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    } as ChatResponse);
  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific OpenAI errors
    if (errorMessage.includes("rate limit")) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes("insufficient_quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API quota exceeded. Please check your billing.",
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Chat service unavailable. Please try again." },
      { status: 500 }
    );
  }
}

function createSystemPrompt(
  repositoryContext: ChatRequest["repositoryContext"]
): string {
  const { repository, wiki } = repositoryContext;

  // Create architecture summary
  const architectureText =
    typeof wiki.architecture === "string"
      ? wiki.architecture
      : `Architecture Style: ${wiki.architecture.style}\n\nSummary: ${
          wiki.architecture.summary
        }\n\nKey Technologies: ${wiki.architecture.technologies.join(
          ", "
        )}\n\nDesign Patterns: ${wiki.architecture.patterns.join(
          ", "
        )}\n\nData Flow: ${
          wiki.architecture.dataFlow
        }\n\nKey Decisions:\n${wiki.architecture.keyDecisions
          .map((d) => `- ${d}`)
          .join("\n")}`;

  // Create sections summary
  const sectionsText = wiki.sections
    .map(
      (section) =>
        `## ${section.title}\n${
          section.summary
        }\n\nKey Takeaways:\n${section.keyTakeaways
          .map((t) => `- ${t}`)
          .join("\n")}\n\nRelated Files: ${section.files.join(", ")}`
    )
    .join("\n\n");

  return `You are an expert code assistant with deep knowledge of the ${
    repository.full_name
  } repository. You have access to the complete codebase analysis and can help developers understand the code, architecture, and implementation details.

REPOSITORY INFORMATION:
- Name: ${repository.full_name}
- Description: ${repository.description || "No description provided"}
- Primary Language: ${repository.language || "Multiple languages"}
- Repository URL: ${repository.html_url}

OVERVIEW:
${wiki.overview}

ARCHITECTURE:
${architectureText}

CODEBASE SECTIONS:
${sectionsText}

INSTRUCTIONS:
1. Provide helpful, accurate answers about the codebase
2. Reference specific files and code sections when relevant
3. Explain complex concepts in a clear, developer-friendly way
4. Suggest best practices and improvements when appropriate
5. If you're unsure about something, say so rather than guessing
6. Use markdown formatting for code snippets and structure
7. Keep responses focused and actionable

You can help with:
- Code explanations and walkthroughs
- Architecture questions
- Implementation details
- Best practices
- Troubleshooting
- Code improvements
- Feature development guidance

Always base your responses on the analyzed codebase context provided above.`;
}
