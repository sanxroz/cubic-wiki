import GitHubInput from "@/components/GitHubInput";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-100">Cubic Wiki</h1>
          <p className="text-lg text-gray-300 max-w-lg mx-auto">
            AI-powered repository wiki generator
          </p>
        </div>

        {/* Main Input */}
        <div className="bg-gray-800  p-8 border border-gray-600">
          <GitHubInput />
        </div>
      </div>
    </div>
  );
}
