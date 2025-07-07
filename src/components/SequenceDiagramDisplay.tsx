"use client";

import { useEffect, useRef, useState } from "react";
import { SequenceDiagram } from "@/lib/types";

interface SequenceDiagramDisplayProps {
  diagrams: SequenceDiagram[];
}

export default function SequenceDiagramDisplay({
  diagrams,
}: SequenceDiagramDisplayProps) {
  const [selectedDiagram, setSelectedDiagram] = useState(0);
  const [mermaid, setMermaid] = useState<any>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Load mermaid dynamically
  useEffect(() => {
    const loadMermaid = async () => {
      try {
        const mermaidModule = await import("mermaid");
        mermaidModule.default.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#f3f4f6",
            primaryBorderColor: "#374151",
            lineColor: "#6b7280",
            sectionBkgColor: "#1f2937",
            altSectionBkgColor: "#111827",
            gridColor: "#374151",
            secondaryColor: "#4b5563",
            tertiaryColor: "#374151",
            background: "#111827",
            mainBkg: "#1f2937",
            secondBkg: "#374151",
            tertiaryBkg: "#4b5563",
          },
        });
        setMermaid(mermaidModule.default);
      } catch (error) {
        console.error("Failed to load mermaid:", error);
      }
    };

    loadMermaid();
  }, []);

  // Render diagram when mermaid is loaded or selected diagram changes
  useEffect(() => {
    if (mermaid && diagramRef.current && diagrams[selectedDiagram]) {
      const renderDiagram = async () => {
        try {
          // Clear previous content
          diagramRef.current!.innerHTML = "";

          // Generate unique ID
          const id = `diagram-${Date.now()}-${selectedDiagram}`;

          // Render the diagram
          const { svg } = await mermaid.render(
            id,
            diagrams[selectedDiagram].mermaidSyntax
          );

          // Insert SVG
          diagramRef.current!.innerHTML = svg;

          // Style the SVG for dark theme
          const svgElement = diagramRef.current!.querySelector("svg");
          if (svgElement) {
            svgElement.style.backgroundColor = "transparent";
            svgElement.style.maxWidth = "100%";
            svgElement.style.height = "auto";
          }
        } catch (error) {
          console.error("Failed to render diagram:", error);
          diagramRef.current!.innerHTML = `
            <div class="p-4 bg-red-900 border border-red-700 rounded text-red-200">
              <p class="font-semibold">Failed to render diagram</p>
              <p class="text-sm mt-1">${
                error instanceof Error ? error.message : "Unknown error"
              }</p>
            </div>
          `;
        }
      };

      renderDiagram();
    }
  }, [mermaid, selectedDiagram, diagrams]);

  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[selectedDiagram];

  return (
    <div className="space-y-6">
      {/* Diagram Tabs */}
      {diagrams.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {diagrams.map((diagram, index) => (
            <button
              key={index}
              onClick={() => setSelectedDiagram(index)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                selectedDiagram === index
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {diagram.title}
            </button>
          ))}
        </div>
      )}

      {/* Diagram Info */}
      <div className="bg-gray-700 p-4 border border-gray-600 rounded">
        <h4 className="text-lg font-semibold text-gray-100 mb-2">
          {currentDiagram.title}
        </h4>
        <p className="text-gray-300 text-sm mb-3">
          {currentDiagram.description}
        </p>

        {/* Scenario and Subsystems */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-400">Scenario:</span>
            <span className="ml-2 px-2 py-1 bg-purple-900 text-purple-200 rounded">
              {currentDiagram.scenario}
            </span>
          </div>
          {currentDiagram.subsystems.length > 0 && (
            <div>
              <span className="text-gray-400">Involves:</span>
              <div className="inline-flex ml-2 gap-1">
                {currentDiagram.subsystems.map((subsystem, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
                  >
                    {subsystem}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagram Container */}
      <div className="bg-gray-800 border border-gray-600 rounded p-6">
        <div
          ref={diagramRef}
          className="w-full overflow-x-auto"
          style={{ minHeight: "300px" }}
        />

        {!mermaid && (
          <div className="flex items-center justify-center min-h-[300px] text-gray-400">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Loading diagram...</p>
            </div>
          </div>
        )}
      </div>

      {/* Related Files */}
      {currentDiagram.relatedFiles.length > 0 && (
        <div className="bg-gray-700 p-4 border border-gray-600 rounded">
          <h4 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
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
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentDiagram.relatedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-gray-600 hover:bg-gray-500 px-3 py-2 text-sm font-mono text-gray-300 border border-gray-500 rounded transition-colors"
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
    </div>
  );
}
