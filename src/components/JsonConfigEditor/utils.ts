import type { EditableField, ArrayFormat } from './types';

const DEFAULT_PLACEHOLDER_REGEX = /:::([\w.]+)/g;

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

export function getPlaceholdersFromText(text: string, pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX): string[] {
  const re = new RegExp(pattern.source, pattern.flags);
  const matches = [...text.matchAll(re)];
  return [...new Set(matches.map((m) => m[1]))];
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
 * Resolve all placeholders in a text string against a context object,
 * returning the full string with placeholders replaced by their resolved values.
 */
export function resolveText(
  text: string,
  context: Record<string, unknown>,
  pattern: RegExp = DEFAULT_PLACEHOLDER_REGEX,
  arrayFormat: ArrayFormat = 'comma',
  customSeparator = ' | ',
): string {
  const re = new RegExp(pattern.source, pattern.flags);
  return text.replace(re, (_match, name: string) => {
    const val = resolveValue(context, name);
    if (val === undefined) return _match; // leave unresolved placeholders as-is
    return formatResolved(val, arrayFormat, customSeparator);
  });
}
