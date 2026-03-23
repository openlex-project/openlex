import { ImageResponse } from "next/og";
import { loadSiteConfig } from "@/lib/site";
import { log } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = loadSiteConfig();
    const title = searchParams.get("title") || site.name;
    const sub = searchParams.get("sub") || "";

    return new ImageResponse(
      (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: "60px 80px", background: "linear-gradient(135deg, #1a1035 0%, #2d1b69 50%, #1a1035 100%)", color: "white", fontFamily: "sans-serif" }}>
          {sub && <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 12 }}>{sub}</div>}
          <div style={{ fontSize: title.length > 60 ? 40 : 56, fontWeight: 700, lineHeight: 1.2, maxWidth: "90%" }}>{title}</div>
          <div style={{ position: "absolute", bottom: 50, left: 80, fontSize: 24, opacity: 0.5 }}>{site.name}</div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch (err) {
    log.error(err, "OG image generation failed");
    return new Response("OG generation error", { status: 500 });
  }
}
