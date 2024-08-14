export interface CastMessagePart {
  isHidden?: boolean;
  text: string;
}

export interface CastMessage {
  parts: CastMessagePart[];
  length: number;
}

export const HIDE_CAST_INDICATOR = "//";

export function toPlainMessage(parts: CastMessagePart[]): string {
  return parts.reduce((acc, p) => {
    const text = p.isHidden
      ? `${HIDE_CAST_INDICATOR}${p.text}${HIDE_CAST_INDICATOR}`
      : p.text;
    return acc + text;
  }, "");
}

export function trimMessage(message: string, maxLength: number): string {
  if (message.length < maxLength) {
    return message.trim();
  }
  const pm = parseCastMessage(message);

  let trimLen = pm.length - maxLength;
  const newParts = [];
  for (let i = pm.parts.length - 1; i >= 0; i--) {
    const { text, isHidden } = pm.parts[i];
    const len = text.length;
    if (trimLen > 0) {
      const newLen = Math.max(0, len - trimLen);
      if (newLen > 0) {
        const newText = text.substring(0, newLen);
        newParts.push({ text: newText, isHidden });
      }
      trimLen -= len;
    } else {
      newParts.push({ text, isHidden });
    }
  }

  return toPlainMessage(newParts.reverse());
}

export function parseCastMessage(message: string): CastMessage {
  const parts: CastMessagePart[] = [];

  let hidden = false;
  let text = "";
  let length = 0;

  for (let i = 0; i < message.length; i++) {
    const c = message[i];
    text += c;
    const endsWithHideCastIndicator = text.endsWith(HIDE_CAST_INDICATOR);
    if (endsWithHideCastIndicator || i === message.length - 1) {
      if (endsWithHideCastIndicator) {
        text = text.slice(0, -HIDE_CAST_INDICATOR.length);
      }
      if (text) {
        const isHidden =
          hidden || (i === message.length - 1 && parts.length === 0);
        parts.push({ isHidden, text });
        length += text.length;
      }
      text = "";
      if (endsWithHideCastIndicator) {
        hidden = !hidden;
      }
    }
  }
  return { parts, length };
}
