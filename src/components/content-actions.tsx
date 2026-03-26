import { BookmarkButton } from "@/components/bookmark-button";
import { ShareMenu } from "@/components/share-menu";
import { ExportMenu } from "@/components/export-menu";
import { loadSiteConfig } from "@/lib/site";

type ContentType = "book" | "law" | "journal";

export function ContentActions({ title, contentType }: { title: string; contentType: ContentType }) {
  const site = loadSiteConfig();
  const f = site.features;
  return (
    <>
      <BookmarkButton title={title} />
      {f?.sharing?.length ? <ShareMenu title={title} siteName={site.name} targets={f.sharing} /> : null}
      {f?.export ? <ExportMenu formats={f.export.formats} requireAuth={f.export.require_auth} contentType={contentType} /> : null}
    </>
  );
}
