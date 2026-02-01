import type { EditableField, ArrayFormat } from './types';

/**
 * Default placeholder regex.
 * Captures: :::name.path  or  :::name.path|format  or  :::name.path|custom(sep)
 * Group 1 = full token after :::  (e.g. "instruments|newline" or "foo.bar|custom(; )")
 * Backward-compatible: :::foo.bar still matches (no pipe = default format).
 */
const DEFAULT_PLACEHOLDER_REGEX = /:::([\w.]+(?:\|(?:comma|newline|json|custom\([^)]*\)))?)/g;

/** Parsed result from a single placeholder token */
export interface ParsedPlaceholder {
  /** The dot-path name, e.g. "instruments" or "user.name" */
  name: string;
  /** The array format hint, or undefined if not specified */
  format?: ArrayFormat;
  /** Custom separator when format is "custom" */
  separator?: string;
  /** The full raw token (everything after :::) */
  raw: string;
}

/**
 * Parse a placeholder token (the part after :::) into its components.
 * Examples:
 *   "foo.bar"              → { name: "foo.bar", raw: "foo.bar" }
 *   "instruments|newline"  → { name: "instruments", format: "newline", raw: "instruments|newline" }
 *   "items|custom(; )"     → { name: "items", format: "custom", separator: "; ", raw: "items|custom(; )" }
 */
export function parsePlaceholder(token: string): ParsedPlaceholder {
  const pipeIdx = token.indexOf('|');
  if (pipeIdx === -1) {
    return { name: token, raw: token };
  }
  const name = token.slice(0, pipeIdx);
  const formatPart = token.slice(pipeIdx + 1);

  const customMatch = formatPart.match(/^custom\(([^)]*)\)$/);
  if (customMatch) {
    return { name, format: 'custom', separator: customMatch[1], raw: token };
  }

  const format = formatPart as ArrayFormat;
  return { name, format, raw: token };
}

/**
 * Build a placeholder string from components.
 * Inverse of parsePlaceholder — used when the UI sets a format.
 */
export function buildPlaceholder(name: string, format?: ArrayFormat, separator?: string): string {
  if (!format || format === 'comma') return `:::${name}`;
  if (format === 'custom') return `:::${name}|custom(${separator ?? ' | '})`;
  return `:::${name}|${format}`;
}

export function hasPlaceholders(value: string, pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX): boolean {
  const re = new RegExp(pattern.source, pattern.flags);
  return re.test(value);
}

export function isLongString(value: string): boolean {
  return value.length > 50 || value.includes('\n');
}

export function findEditableFields(
  obj: unknown,
  path = '',
  pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX,
): EditableField[] {
  const fields: EditableField[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = path ? `${path}.${index}` : `${index}`;
      if (typeof item === 'string') {
        fields.push({
          path: currentPath,
          value: item,
          key: `[${index}]`,
          hasPlaceholders: hasPlaceholders(item, pattern),
          isLong: isLongString(item),
        });
      } else if (typeof item === 'object' && item !== null) {
        fields.push(...findEditableFields(item, currentPath, pattern));
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        fields.push({
          path: currentPath,
          value,
          key,
          hasPlaceholders: hasPlaceholders(value, pattern),
          isLong: isLongString(value),
        });
      } else if (typeof value === 'object' && value !== null) {
        fields.push(...findEditableFields(value, currentPath, pattern));
      }
    }
  }

  return fields;
}

export function setValueAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj));
  let current: Record<string, unknown> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current = current[isNaN(Number(key)) ? key : Number(key)] as Record<string, unknown>;
  }
  const finalKey = keys[keys.length - 1];
  current[isNaN(Number(finalKey)) ? finalKey : Number(finalKey)] = value;
  return result;
}

/**
 * Extract unique placeholder *names* (without format hints) from text.
 */
export function getPlaceholdersFromText(text: string, pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX): string[] {
  const re = new RegExp(pattern.source, pattern.flags);
  const matches = [...text.matchAll(re)];
  return [...new Set(matches.map((m) => parsePlaceholder(m[1]).name))];
}

/**
 * Walk a context object by a dot-separated path (e.g. "parent.sub" → context.parent.sub).
 * Returns `undefined` when the path doesn't exist.
 */
export function resolveValue(context: Record<string, unknown>, dotPath: string): unknown {
  const keys = dotPath.split('.');
  let current: unknown = context;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Format a resolved value as a display string.
 * Arrays are formatted according to the chosen ArrayFormat.
 */
export function formatResolved(
  value: unknown,
  arrayFormat: ArrayFormat = 'comma',
  customSeparator = ' | ',
): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    switch (arrayFormat) {
      case 'newline':
        return value.map(String).join('\n');
      case 'json':
        return JSON.stringify(value);
      case 'custom':
        return value.map(String).join(customSeparator);
      case 'comma':
      default:
        return value.map(String).join(', ');
    }
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Extract all dot-paths from a context object (leaf values only).
 * E.g. { user: { name: "A", address: { city: "M" } }, items: [1,2] }
 * → ["user.name", "user.address.city", "items"]
 */
export function getContextPaths(obj: unknown, prefix = ''): string[] {
  const paths: string[] = [];
  if (obj == null || typeof obj !== 'object') return paths;
  if (Array.isArray(obj)) {
    // Arrays are treated as leaf values (the user inserts :::items, not :::items.0)
    if (prefix) paths.push(prefix);
    return paths;
  }
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getContextPaths(value, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

/**
 * Resolve all placeholders in a text string against a context object,
 * returning the full string with placeholders replaced by their resolved values.
 *
 * Inline format hints take precedence: :::items|newline uses "newline".
 * Plain :::items falls back to the `defaultArrayFormat` parameter.
 *
 * This is the function your downstream application should use.
 * Import it and call: resolveText(fieldValue, context)
 */
export function resolveText(
  text: string,
  context: Record<string, unknown>,
  pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX,
  defaultArrayFormat: ArrayFormat = 'comma',
  defaultCustomSeparator = ' | ',
): string {
  const re = new RegExp(pattern.source, pattern.flags);
  return text.replace(re, (_match, token: string) => {
    const parsed = parsePlaceholder(token);
    const val = resolveValue(context, parsed.name);
    if (val === undefined) return _match; // leave unresolved placeholders as-is
    const fmt = parsed.format ?? defaultArrayFormat;
    const sep = parsed.separator ?? defaultCustomSeparator;
    return formatResolved(val, fmt, sep);
  });
}
