"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import type { AnalyticsConfig } from "@/lib/site";

const VercelAnalytics = dynamic(() => import("@vercel/analytics/next").then((m) => m.Analytics));
const VercelSpeedInsights = dynamic(() => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights));

export function SiteAnalytics({ config }: { config?: AnalyticsConfig }) {
  if (!config) return null;

  switch (config.provider) {
    case "vercel":
      return <><VercelAnalytics /><VercelSpeedInsights /></>;
    case "plausible":
      return <Script defer data-domain={config.domain} src="https://plausible.io/js/script.js" />;
    case "matomo":
      return <Script id="matomo" dangerouslySetInnerHTML={{ __html: `var _paq=window._paq=window._paq||[];_paq.push(["trackPageView"]);_paq.push(["enableLinkTracking"]);(function(){var u="${config.url}/";_paq.push(["setTrackerUrl",u+"matomo.php"]);_paq.push(["setSiteId","${config.site_id}"]);var d=document,g=d.createElement("script"),s=d.getElementsByTagName("script")[0];g.async=true;g.src=u+"matomo.js";s.parentNode.insertBefore(g,s)})();` }} />;
    case "umami":
      return <Script defer src={`${config.url}/script.js`} data-website-id={config.site_id} />;
    case "goatcounter":
      return <Script data-goatcounter={config.url} async src="//gc.zgo.at/count.js" />;
    default:
      return null;
  }
}
