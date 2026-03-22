import { notFound } from "next/navigation";
import { buildRegistry } from "@/lib/registry";
import BookPage from "./book";
import LawPage from "./law";
import JournalPage from "./journal";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) notFound();

  const registry = await buildRegistry();
  const content = registry.slugMap.get(slug[0]!);
  if (!content) notFound();

  const rest = slug.slice(1);

  switch (content.type) {
    case "book":
      return BookPage({ registry, entry: content.entry, rest });
    case "law":
      return LawPage({ registry, entry: content.entry, rest });
    case "journal":
      return JournalPage({ registry, entry: content.entry, rest });
  }
}
