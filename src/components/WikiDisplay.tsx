"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { usePathname } from "next/navigation";
import { WikiData, WikiSection, CitationLink } from "@/lib/types";
import ProjectTree from "./ProjectTree";
import InsightsDashboard from "./InsightsDashboard";

interface WikiDisplayProps {
  wikiData: WikiData;
}

export default function WikiDisplay({ wikiData }: WikiDisplayProps) {
  const { repository, wiki } = wikiData;
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-900  flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-100">
              {repository.full_name}
            </h1>
          </div>
          {repository.description && (
            <p className="text-gray-300 text-lg mb-4">
              {repository.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 px-3 py-1 bg-gray-700 border border-gray-600">
              <span className="w-2 h-2 bg-blue-400 -full"></span>
              <span className="text-gray-300">
                {repository.language || "Multiple languages"}
              </span>
            </span>
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on GitHub
            </a>
            <a
              href={`${pathname}/digest`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white  transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Get LLM Digest
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8">
              <div className="bg-gray-800  border border-gray-600 p-6">
                <h2 className="font-semibold text-gray-100 mb-4">Contents</h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#overview"
                      className="flex items-center gap-2 text-gray-300 hover:text-blue-400 py-2 px-3  hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-2 h-2 bg-blue-400 -full"></div>
                      Overview
                    </a>
                  </li>
                  <li>
                    <a
                      href="#architecture"
                      className="flex items-center gap-2 text-gray-300 hover:text-blue-400 py-2 px-3  hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-2 h-2 bg-green-400 -full"></div>
                      Architecture
                    </a>
                  </li>
                  {wikiData.projectTree && (
                    <li>
                      <a
                        href="#project-structure"
                        className="flex items-center gap-2 text-gray-300 hover:text-blue-400 py-2 px-3  hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-2 h-2 bg-purple-400 -full"></div>
                        Project Structure
                      </a>
                    </li>
                  )}
                  {wikiData.insights && (
                    <li>
                      <a
                        href="#insights"
                        className="flex items-center gap-2 text-gray-300 hover:text-blue-400 py-2 px-3  hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-2 h-2 bg-orange-400 -full"></div>
                        Insights
                      </a>
                    </li>
                  )}
                  {wiki.sections.map((section, index) => (
                    <li key={index}>
                      <a
                        href={`#section-${index}`}
                        className="flex items-center gap-2 text-gray-300 hover:text-blue-400 py-2 px-3  hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-2 h-2 bg-gray-400 -full"></div>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Overview Section */}
              <section
                id="overview"
                className="bg-gray-800  border border-gray-600 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-900  flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100">Overview</h2>
                </div>
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                    {wiki.overview}
                  </ReactMarkdown>
                </div>
              </section>

              {/* Architecture Section */}
              <section
                id="architecture"
                className="bg-gray-800  border border-gray-600 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-900  flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100">
                    Architecture
                  </h2>
                </div>
                {typeof wiki.architecture === "string" ? (
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {wiki.architecture}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Architecture Summary */}
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {wiki.architecture.summary}
                      </p>
                    </div>

                    {/* Architecture Style */}
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-700  flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-green-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400">
                          Architecture Style
                        </span>
                        <div className="text-lg font-semibold text-gray-100">
                          {wiki.architecture.style}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Design Patterns */}
                      {wiki.architecture.patterns.length > 0 && (
                        <div className="bg-gray-700  p-4 border border-gray-600">
                          <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2m0 0h10a2 2 0 002-2V7a2 2 0 00-2-2H9m0 12V9m0 0h10"
                              />
                            </svg>
                            Design Patterns
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {wiki.architecture.patterns.map(
                              (pattern, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-900 text-blue-200 text-sm border border-blue-700"
                                >
                                  {pattern}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Technologies */}
                      {wiki.architecture.technologies.length > 0 && (
                        <div className="bg-gray-700  p-4 border border-gray-600">
                          <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                              />
                            </svg>
                            Technologies
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {wiki.architecture.technologies.map(
                              (tech, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-purple-900 text-purple-200 text-sm border border-purple-700"
                                >
                                  {tech}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data Flow */}
                    <div className="bg-gray-700  p-4 border border-gray-600">
                      <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Data Flow
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {wiki.architecture.dataFlow}
                      </p>
                    </div>

                    {/* Key Decisions */}
                    {wiki.architecture.keyDecisions.length > 0 && (
                      <div className="bg-gray-700  p-4 border border-gray-600">
                        <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Key Architectural Decisions
                        </h4>
                        <ul className="space-y-2">
                          {wiki.architecture.keyDecisions.map(
                            (decision, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="w-1.5 h-1.5 bg-orange-400 mt-2 flex-shrink-0"></div>
                                <span className="text-gray-300 text-sm leading-relaxed">
                                  {decision}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Project Structure Section */}
              {wikiData.projectTree && (
                <section
                  id="project-structure"
                  className="bg-gray-800  border border-gray-600 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-900  flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Project Structure
                    </h2>
                  </div>
                  <ProjectTree
                    tree={wikiData.projectTree.root}
                    totalFiles={wikiData.projectTree.totalFiles}
                    totalDirectories={wikiData.projectTree.totalDirectories}
                    repositoryUrl={repository.html_url}
                    defaultBranch={repository.default_branch}
                  />
                </section>
              )}

              {/* Insights Section */}
              {wikiData.insights && (
                <section
                  id="insights"
                  className="bg-gray-800  border border-gray-600 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-900  flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Insights
                    </h2>
                  </div>
                  <InsightsDashboard insights={wikiData.insights} />
                </section>
              )}

              {/* Dynamic Sections */}
              {wiki.sections.map((section, index) => (
                <WikiSectionComponent
                  key={index}
                  section={section}
                  sectionIndex={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WikiSectionComponentProps {
  section: WikiSection;
  sectionIndex: number;
}

function WikiSectionComponent({
  section,
  sectionIndex,
}: WikiSectionComponentProps) {
  const colors = [
    "bg-red-900 text-red-400",
    "bg-orange-900 text-orange-400",
    "bg-yellow-900 text-yellow-400",
    "bg-green-900 text-green-400",
    "bg-teal-900 text-teal-400",
    "bg-blue-900 text-blue-400",
    "bg-indigo-900 text-indigo-400",
    "bg-purple-900 text-purple-400",
  ];

  const colorClass = colors[sectionIndex % colors.length];

  return (
    <section
      id={`section-${sectionIndex}`}
      className="bg-gray-800  border border-gray-600 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-8 h-8 ${colorClass}  flex items-center justify-center`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-100">{section.title}</h2>
          {section.summary && (
            <p className="text-gray-400 text-lg mt-1">{section.summary}</p>
          )}
        </div>
      </div>

      {/* Key Takeaways */}
      {section.keyTakeaways && section.keyTakeaways.length > 0 && (
        <div className="bg-gray-700  p-4 mb-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Key Takeaways
          </h3>
          <ul className="space-y-2">
            {section.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-sm leading-relaxed">
                  {takeaway}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="prose prose-gray max-w-none mb-6">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {/* Files List */}
      {section.files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Related Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {section.files.map((file, fileIndex) => (
              <div
                key={fileIndex}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm font-mono text-gray-300 border border-gray-600  transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">{file}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations */}
      {section.citations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            References
          </h3>
          <div className="space-y-2">
            {section.citations.map((citation, citationIndex) => (
              <CitationComponent key={citationIndex} citation={citation} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface CitationComponentProps {
  citation: CitationLink;
}

function CitationComponent({ citation }: CitationComponentProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-blue-900 hover:bg-blue-800  border border-blue-700 transition-colors">
      <div className="flex-shrink-0 w-2 h-2 bg-blue-400 mt-2"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 mb-2">{citation.text}</p>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-mono hover:underline transition-colors"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="break-all">
            {citation.file}
            {citation.line && `:${citation.line}`}
          </span>
        </a>
      </div>
      <div className="flex-shrink-0 h-fit">
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 flex text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
