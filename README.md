# Cubic Wiki

AI-powered GitHub repository documentation generator that analyzes any public repository and creates comprehensive documentation with architecture insights, project structure visualization, and interactive diagrams.

## Features

- **Smart Analysis**: Automatically identifies subsystems, architecture patterns, and key components using OpenAI o1-mini
- **Interactive Project Tree**: Visual file structure with expandable directories and file type icons
- **Sequence Diagrams**: Auto-generated Mermaid diagrams showing component interactions
- **Project Insights Dashboard**: Comprehensive analysis including architecture patterns, tech stack, and recommendations
- **Inline Citations**: Every insight links directly to specific files and lines in the repository
- **Clean Navigation**: Browse through organized sections with sidebar navigation
- **Recent Repositories**: Quick access to previously analyzed repositories
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Smart Caching**: Analysis results are cached locally to improve performance and reduce API costs

## Tech Stack

- **Framework**: Next.js 15 with TypeScript and Turbopack
- **AI**: OpenAI gpt-4.1-mini model with structured analysis
- **Database**: Neon PostgreSQL for caching and analytics
- **GitHub API**: Octokit for repository fetching and analysis
- **UI**: Tailwind CSS v4 with custom components and responsive design
- **Diagrams**: Mermaid.js for sequence diagrams and flowcharts
- **Markdown**: React Markdown with rehype-sanitize for secure content rendering
- **Validation**: Zod for type-safe API validation

## Usage

1. **Enter a GitHub URL**: Paste any public GitHub repository URL into the input field
2. **Start Analysis**: Click "Analyze Repository" to begin the AI-powered analysis
3. **Explore the Results**: You'll be redirected to a comprehensive wiki with multiple views:
   - **Overview**: Repository summary and architecture description
   - **Project Tree**: Interactive file structure with expandable directories
   - **Insights Dashboard**: Detailed analysis including:
     - Architecture patterns and design principles
     - Technology stack breakdown
     - Code quality metrics and recommendations
     - Security considerations
   - **Sequence Diagrams**: Visual representation of component interactions
   - **File References**: Direct links to source code with line numbers

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with GitHub input
│   ├── repo/[url]/page.tsx         # Wiki display page
│   └── api/
│       ├── analyze/route.ts        # Main analysis API endpoint
│       ├── codebase-digest/route.ts # Repository content processing
│       ├── github-status/          # GitHub API status checks
│       └── recent-repos/route.ts   # Recent repositories management
├── components/
│   ├── GitHubInput.tsx             # URL input form with validation
│   ├── WikiDisplay.tsx             # Main wiki content display
│   ├── ProjectTree.tsx             # Interactive file tree component
│   ├── InsightsDashboard.tsx       # Project insights and metrics
│   ├── SequenceDiagramDisplay.tsx  # Mermaid diagram renderer
│   ├── RecentRepos.tsx             # Recent repositories list
│   └── tree/                       # Tree component utilities
├── hooks/
│   └── useTreeExpansion.ts         # Tree state management
└── lib/
    ├── github.ts                   # GitHub API utilities
    ├── ai.ts                       # OpenAI processing
    ├── cache.ts                    # Caching utilities
    ├── insights-analyzer.ts        # Project insights analysis
    ├── sequence-analyzer.ts        # Sequence diagram generation
    ├── subsystem-analyzer.ts       # Component relationship analysis
    ├── tree-builder.ts             # Project tree construction
    ├── types.ts                    # TypeScript definitions
    └── utils.ts                    # Utility functions
```

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

- `OPENAI_API_KEY`: Your OpenAI API key
- `GITHUB_TOKEN`: GitHub personal access token (optional but recommended)
- `DATABASE_URL`: PostgreSQL connection string (optional, for caching)
