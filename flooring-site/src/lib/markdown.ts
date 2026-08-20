import { marked } from "marked";
import { slugify } from "@/lib/slugify";

export type Heading = { id: string; text: string };

// Articles are admin-authored only (SPEC.md §8 — single-login admin with
// full DB access already), so raw HTML passthrough from markdown isn't a
// privilege-escalation risk here the way it would be for user-submitted
// content; no extra sanitization pass is applied.
function extractH2Headings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const text = match[1].trim();
    const base = slugify(text) || `section-${headings.length + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    headings.push({ id: count === 0 ? base : `${base}-${count + 1}`, text });
  }

  return headings;
}

export type FaqPair = { question: string; answer: string };

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .trim();
}

// Convention: any "### Question ending in a question mark" heading is a FAQ
// entry — the answer is whatever plain text follows until the next heading.
// Lets an article author add FAQ content anywhere in the body without a
// separate CMS field, while still producing real FAQPage JSON-LD.
export function extractFaq(markdown: string): FaqPair[] {
  const lines = markdown.split("\n");
  const faq: FaqPair[] = [];
  let current: FaqPair | null = null;

  for (const line of lines) {
    const questionMatch = /^###\s+(.+\?)\s*$/.exec(line.trim());
    if (questionMatch) {
      if (current && current.answer.trim()) faq.push(current);
      current = { question: stripInlineMarkdown(questionMatch[1]), answer: "" };
      continue;
    }
    if (/^#{1,3}\s+/.test(line.trim())) {
      if (current && current.answer.trim()) faq.push(current);
      current = null;
      continue;
    }
    if (current) {
      current.answer += `${stripInlineMarkdown(line)} `;
    }
  }
  if (current && current.answer.trim()) faq.push(current);

  return faq.map((f) => ({ question: f.question, answer: f.answer.trim() }));
}

export function renderArticle(markdown: string): { html: string; headings: Heading[] } {
  const headings = extractH2Headings(markdown);
  const html = marked.parse(markdown, { async: false }) as string;

  // marked doesn't attach ids to headings by default — inject them in
  // document order so the table of contents can link to real anchors.
  let index = 0;
  const withIds = html.replace(/<h2>(.*?)<\/h2>/g, (full, inner: string) => {
    const heading = headings[index++];
    return heading ? `<h2 id="${heading.id}">${inner}</h2>` : full;
  });

  return { html: withIds, headings };
}
