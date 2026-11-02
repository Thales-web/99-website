import site from "../data/site.json";
import { t } from "../lib/ui.js";
export function GET() {
  const b = site.business;
  const line = (p) => `- [${p.page_name}](${site.site_url}${p.url})`;
  const group = (title, t) => {
    const items = site.pages.filter((p) => p.type === t).map(line);
    return items.length ? [`## ${title}`, ...items, ""] : [];
  };
  const body = [`# ${b.name}`, "", t.llmsLead(b.home_city, b.phone), "",
    ...group(t.llmsServices, "service"), ...group(t.llmsAreas, "area"), ...group(t.llmsGuides, "blog")].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
