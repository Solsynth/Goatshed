import MarkdownIt from "markdown-it";
import { fromHighlighter } from "@shikijs/markdown-it";
import { createHighlighter } from "shiki";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

const SOLIAN_FILE_PREFIX = "solian://files/";
const DRIVE_FILE_PREFIX = "https://api.solian.app/drive/files/";

function transformSolianFileUrl(url: string): string {
  if (!url.startsWith(SOLIAN_FILE_PREFIX)) return url;
  const filePath = url.slice(SOLIAN_FILE_PREFIX.length);
  return `${DRIVE_FILE_PREFIX}${filePath}`;
}

const defaultNormalizeLink = md.normalizeLink.bind(md);
md.normalizeLink = (url) => defaultNormalizeLink(transformSolianFileUrl(url));

let shikiReady: Promise<void> | null = null;
let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;
const loadedLanguages = new Set<string>(["plaintext"]);
const failedLanguages = new Set<string>();

const LANGUAGE_ALIASES: Record<string, string> = {
  shell: "bash",
  sh: "bash",
  yml: "yaml",
  js: "javascript",
  ts: "typescript",
  md: "markdown",
  text: "plaintext",
  conf: "ini",
  config: "ini",
  cfg: "ini",
};

function normalizeLanguage(input: string): string {
  const key = input.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || key;
}

function detectFenceLanguages(content: string): string[] {
  const matches = content.matchAll(/^```([\w#+.-]+)/gm);
  const result = new Set<string>();
  for (const match of matches) {
    const raw = match[1];
    if (!raw) continue;
    result.add(normalizeLanguage(raw));
  }
  return [...result];
}

function ensureShiki() {
  if (!shikiReady) {
    shikiReady = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["plaintext"],
    }).then((highlighter) => {
      highlighterInstance = highlighter;
      md.use(
        fromHighlighter(highlighter, {
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultLanguage: "plaintext",
        }),
      );
    });
  }
  return shikiReady;
}

async function ensureLanguagesForContent(content: string) {
  await ensureShiki();
  if (!highlighterInstance) return;

  const languages = detectFenceLanguages(content);
  for (const lang of languages) {
    if (loadedLanguages.has(lang) || failedLanguages.has(lang)) continue;
    try {
      await highlighterInstance.loadLanguage(lang);
      loadedLanguages.add(lang);
    } catch {
      failedLanguages.add(lang);
    }
  }
}

const defaultLinkOpen = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer nofollow");
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

export async function renderMarkdown(content: string): Promise<string> {
  try {
    await ensureLanguagesForContent(content || "");
    return md.render(content || "");
  } catch (e) {
    console.error("[markdown] Render failed, falling back without highlighting:", e);
    const plainMd = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true,
    });
    return plainMd.render(content || "");
  }
}
