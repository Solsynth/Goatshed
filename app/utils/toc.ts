export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(html: string): TocItem[] {
  const headingRegex = /<h([2-4])[^>]*>(.*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fa5-]/g, "");

    if (text) {
      items.push({ id, text, level });
    }
  }

  return items;
}

export function injectHeadingIds(html: string): string {
  return html.replace(
    /<h([2-4])([^>]*)>(.*?)<\/h\1>/gi,
    (_, level, attrs, content) => {
      const text = content.replace(/<[^>]+>/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "");
      return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
    },
  );
}
