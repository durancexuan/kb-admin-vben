export interface RobotDocChunkDraft {
  body: string;
  chunkIndex: number;
  heading: string;
}

export const CHUNK_MAX_CHARS = 480;
export const CHUNK_OVERLAP_CHARS = 80;
const HEADING_RE = /^(#{1,4})\s+(.+)$/;

export function splitDocIntoChunks(title: string, content: string) {
  const normalized = content.replaceAll('\r\n', '\n').trim();
  if (!normalized) {
    return [] as RobotDocChunkDraft[];
  }

  const sections = parseSections(normalized);
  const chunks: RobotDocChunkDraft[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    for (const piece of splitLongText(section.text)) {
      chunks.push({
        chunkIndex,
        heading: section.heading || title,
        body: piece,
      });
      chunkIndex += 1;
    }
  }

  if (chunks.length === 0) {
    chunks.push({ chunkIndex: 0, heading: title, body: normalized });
  }

  return chunks;
}

function parseSections(content: string) {
  const lines = content.split('\n');
  const sections: Array<{ heading: string; text: string }> = [];
  let currentHeading = '';
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) {
      sections.push({ heading: currentHeading, text });
    }
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2]?.trim() ?? '';
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (sections.length === 0) {
    sections.push({ heading: '', text: content });
  }
  return sections;
}

function splitLongText(text: string) {
  if (text.length <= CHUNK_MAX_CHARS) {
    return [text];
  }

  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_MAX_CHARS, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + CHUNK_MAX_CHARS * 0.4) {
        end = paragraphBreak;
      }
    }
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) {
      break;
    }
    start = Math.max(end - CHUNK_OVERLAP_CHARS, start + 1);
  }
  return parts.filter(Boolean);
}

export function buildChunkEmbedText(params: {
  body: string;
  category: string;
  heading: string;
  title: string;
}) {
  const heading = params.heading || params.title;
  return `【${params.category}】${heading}\n${params.body.trim()}`;
}

export function pickSpeakFromChunk(params: {
  body: string;
  heading: string;
  title: string;
  utterance: string;
}) {
  const text = params.body.trim();
  if (text.length <= 320) {
    return text;
  }

  const query = params.utterance.trim();
  if (!query) {
    return `${params.heading || params.title}：${text.slice(0, 280)}…`;
  }

  const sentences = text.split(/(?<=[。！？；\n])/);
  const matched = sentences.filter((line) => line.includes(query.slice(0, 8)));
  if (matched.length > 0) {
    return matched.slice(0, 2).join('').trim().slice(0, 320);
  }

  return `${params.heading || params.title}：${text.slice(0, 280)}…`;
}
