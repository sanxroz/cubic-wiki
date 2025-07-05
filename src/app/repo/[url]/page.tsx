import { notFound } from "next/navigation";
import WikiDisplay from "@/components/WikiDisplay";
import { WikiData } from "@/lib/types";
import { getCachedAnalysis } from "@/lib/cache";

interface PageProps {
  params: Promise<{ url: string }>;
}

export default async function WikiPage({ params }: PageProps) {
  const { url } = await params;

  try {
    // Get the wiki data from cache
    const wikiData = await getCachedAnalysis(url);

    if (!wikiData) {
      notFound();
    }

    return <WikiDisplay wikiData={wikiData} />;
  } catch (error) {
    console.error("Error loading wiki data:", error);
    notFound();
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { url } = await params;

  try {
    const wikiData = await getCachedAnalysis(url);

    if (!wikiData) {
      return {
        title: "Wiki Not Found - Cubic Wiki",
        description: "The requested repository wiki could not be found.",
      };
    }

    const { repository } = wikiData;

    return {
      title: `${repository.full_name} - Cubic Wiki`,
      description:
        repository.description || `Documentation for ${repository.full_name}`,
      openGraph: {
        title: `${repository.full_name} Documentation`,
        description:
          repository.description ||
          `AI-generated documentation for ${repository.full_name}`,
        type: "article",
      },
    };
  } catch (error) {
    return {
      title: "Cubic Wiki",
      description: "AI-powered repository documentation generator",
    };
  }
}
