import { describe, it, expect } from 'vitest';
import {
  parsePlaceholder,
  buildPlaceholder,
  hasPlaceholders,
  isLongString,
  findEditableFields,
  setValueAtPath,
  getPlaceholdersFromText,
  resolveValue,
  formatResolved,
  getContextPaths,
  resolveText,
  resolveConfig,
} from './utils';

// ─── parsePlaceholder ────────────────────────────────────────────────────────

describe('parsePlaceholder', () => {
  it('parses a simple name', () => {
    expect(parsePlaceholder('foo.bar')).toEqual({
      name: 'foo.bar',
      raw: 'foo.bar',
    });
  });

  it('parses name with comma format', () => {
    expect(parsePlaceholder('items|comma')).toEqual({
      name: 'items',
      format: 'comma',
      raw: 'items|comma',
    });
  });

  it('parses name with newline format', () => {
    expect(parsePlaceholder('items|newline')).toEqual({
      name: 'items',
      format: 'newline',
      raw: 'items|newline',
    });
  });

  it('parses name with json format', () => {
    expect(parsePlaceholder('arr|json')).toEqual({
      name: 'arr',
      format: 'json',
      raw: 'arr|json',
    });
  });

  it('parses name with custom format and separator', () => {
    expect(parsePlaceholder('items|custom(; )')).toEqual({
      name: 'items',
      format: 'custom',
      separator: '; ',
      raw: 'items|custom(; )',
    });
  });

  it('parses custom with empty separator', () => {
    expect(parsePlaceholder('items|custom()')).toEqual({
      name: 'items',
      format: 'custom',
      separator: '',
      raw: 'items|custom()',
    });
  });
});

// ─── buildPlaceholder ────────────────────────────────────────────────────────

describe('buildPlaceholder', () => {
  it('builds plain placeholder when no format', () => {
    expect(buildPlaceholder('foo.bar')).toBe(':::foo.bar');
  });

  it('builds plain placeholder for comma format (default)', () => {
    expect(buildPlaceholder('items', 'comma')).toBe(':::items');
  });

  it('builds newline format', () => {
    expect(buildPlaceholder('items', 'newline')).toBe(':::items|newline');
  });

  it('builds json format', () => {
    expect(buildPlaceholder('items', 'json')).toBe(':::items|json');
  });

  it('builds custom format with separator', () => {
    expect(buildPlaceholder('items', 'custom', '; ')).toBe(':::items|custom(; )');
  });

  it('builds custom format with default separator when none provided', () => {
    expect(buildPlaceholder('items', 'custom')).toBe(':::items|custom( | )');
  });
});

// ─── hasPlaceholders ─────────────────────────────────────────────────────────

describe('hasPlaceholders', () => {
  it('returns true when text contains placeholders', () => {
    expect(hasPlaceholders('Hello :::user.name!')).toBe(true);
  });

  it('returns false when no placeholders', () => {
    expect(hasPlaceholders('Hello world!')).toBe(false);
  });

  it('detects placeholders with format hints', () => {
    expect(hasPlaceholders('Items: :::items|newline')).toBe(true);
  });
});

// ─── isLongString ────────────────────────────────────────────────────────────

describe('isLongString', () => {
  it('returns false for short strings', () => {
    expect(isLongString('short')).toBe(false);
  });

  it('returns true for strings > 50 chars', () => {
    expect(isLongString('a'.repeat(51))).toBe(true);
  });

  it('returns true for strings with newlines', () => {
    expect(isLongString('line1\nline2')).toBe(true);
  });
});

// ─── findEditableFields ──────────────────────────────────────────────────────

describe('findEditableFields', () => {
  it('finds string fields in a flat object', () => {
    const obj = { name: 'hello', count: 42 };
    const fields = findEditableFields(obj);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ path: 'name', value: 'hello', key: 'name' });
  });

  it('finds nested string fields', () => {
    const obj = { a: { b: { c: 'deep' } } };
    const fields = findEditableFields(obj);
    expect(fields).toHaveLength(1);
    expect(fields[0].path).toBe('a.b.c');
  });

  it('finds fields in arrays', () => {
    const obj = { items: ['one', 'two'] };
    const fields = findEditableFields(obj);
    expect(fields).toHaveLength(2);
    expect(fields[0].path).toBe('items.0');
    expect(fields[1].path).toBe('items.1');
  });

  it('detects placeholders in fields', () => {
    const obj = { msg: 'Hello :::user.name' };
    const fields = findEditableFields(obj);
    expect(fields[0].hasPlaceholders).toBe(true);
  });

  it('marks long strings', () => {
    const obj = { msg: 'a'.repeat(60) };
    const fields = findEditableFields(obj);
    expect(fields[0].isLong).toBe(true);
  });

  it('finds fields in arrays of objects', () => {
    const obj = { list: [{ name: 'Alice' }, { name: 'Bob' }] };
    const fields = findEditableFields(obj);
    expect(fields).toHaveLength(2);
    expect(fields[0].path).toBe('list.0.name');
    expect(fields[1].path).toBe('list.1.name');
  });
});

// ─── setValueAtPath ──────────────────────────────────────────────────────────

describe('setValueAtPath', () => {
  it('sets a top-level value', () => {
    const obj = { name: 'old' };
    const result = setValueAtPath(obj, 'name', 'new');
    expect(result.name).toBe('new');
    expect(obj.name).toBe('old'); // original untouched
  });

  it('sets a nested value', () => {
    const obj = { a: { b: { c: 'old' } } };
    const result = setValueAtPath(obj, 'a.b.c', 'new');
    expect((result.a as any).b.c).toBe('new');
  });

  it('sets a value in an array', () => {
    const obj = { items: ['a', 'b', 'c'] };
    const result = setValueAtPath(obj, 'items.1', 'B');
    expect((result.items as string[])[1]).toBe('B');
  });
});

// ─── getPlaceholdersFromText ─────────────────────────────────────────────────

describe('getPlaceholdersFromText', () => {
  it('extracts placeholder names', () => {
    const text = 'Hello :::user.name, your id is :::data.id';
    expect(getPlaceholdersFromText(text)).toEqual(['user.name', 'data.id']);
  });

  it('deduplicates names', () => {
    const text = ':::foo and :::foo again';
    expect(getPlaceholdersFromText(text)).toEqual(['foo']);
  });

  it('strips format hints from names', () => {
    const text = ':::items|newline and :::prices|custom(; )';
    expect(getPlaceholdersFromText(text)).toEqual(['items', 'prices']);
  });

  it('returns empty array when no placeholders', () => {
    expect(getPlaceholdersFromText('no placeholders here')).toEqual([]);
  });
});

// ─── resolveValue ────────────────────────────────────────────────────────────

describe('resolveValue', () => {
  describe('flat context (dataKey = null)', () => {
    const ctx = { foo: 'bar', nested: { deep: 'val' } };

    it('resolves a top-level key', () => {
      expect(resolveValue(ctx, 'foo', null)).toBe('bar');
    });

    it('resolves a nested path', () => {
      expect(resolveValue(ctx, 'nested.deep', null)).toBe('val');
    });

    it('returns undefined for missing path', () => {
      expect(resolveValue(ctx, 'missing', null)).toBeUndefined();
    });
  });

  describe('nested context (dataKey = "data")', () => {
    const ctx = {
      user: {
        data: { firstName: 'Andrea', address: { city: 'Milan' } },
        lastUpdatedAt: '2026-01-01',
      },
      instruments: {
        data: ['AAPL', 'MSFT'],
        lastUpdatedAt: '2026-01-01',
      },
    };

    it('resolves through data key for multi-segment path', () => {
      expect(resolveValue(ctx, 'user.firstName')).toBe('Andrea');
    });

    it('resolves deeply nested through data key', () => {
      expect(resolveValue(ctx, 'user.address.city')).toBe('Milan');
    });

    it('auto-drills single-segment into data when result has data key', () => {
      expect(resolveValue(ctx, 'instruments')).toEqual(['AAPL', 'MSFT']);
    });

    it('still resolves metadata keys via direct path', () => {
      expect(resolveValue(ctx, 'user.lastUpdatedAt')).toBe('2026-01-01');
    });

    it('returns undefined for missing paths', () => {
      expect(resolveValue(ctx, 'user.nonexistent')).toBeUndefined();
    });

    it('returns undefined for completely missing top-level', () => {
      expect(resolveValue(ctx, 'missing.key')).toBeUndefined();
    });
  });
});

// ─── formatResolved ──────────────────────────────────────────────────────────

describe('formatResolved', () => {
  it('formats a string', () => {
    expect(formatResolved('hello')).toBe('hello');
  });

  it('formats a number', () => {
    expect(formatResolved(42)).toBe('42');
  });

  it('formats null', () => {
    expect(formatResolved(null)).toBe('null');
  });

  it('formats undefined as empty string', () => {
    expect(formatResolved(undefined)).toBe('');
  });

  it('formats an object as JSON', () => {
    expect(formatResolved({ a: 1 })).toBe('{"a":1}');
  });

  it('formats array with comma (default)', () => {
    expect(formatResolved([1, 2, 3])).toBe('1, 2, 3');
  });

  it('formats array with newline', () => {
    expect(formatResolved([1, 2, 3], 'newline')).toBe('1\n2\n3');
  });

  it('formats array as json', () => {
    expect(formatResolved([1, 2], 'json')).toBe('[1,2]');
  });

  it('formats array with custom separator', () => {
    expect(formatResolved(['a', 'b', 'c'], 'custom', ' | ')).toBe('a | b | c');
  });
});

// ─── getContextPaths ─────────────────────────────────────────────────────────

describe('getContextPaths', () => {
  it('extracts flat paths (no dataKey)', () => {
    const ctx = { foo: 'bar', nested: { deep: 'val' } };
    expect(getContextPaths(ctx, '', null)).toEqual(['foo', 'nested.deep']);
  });

  it('skips data key in nested context', () => {
    const ctx = {
      user: {
        data: { name: 'Andrea', email: 'a@b.com' },
        lastUpdatedAt: '2026',
      },
    };
    const paths = getContextPaths(ctx);
    expect(paths).toContain('user.name');
    expect(paths).toContain('user.email');
    expect(paths).toContain('user.lastUpdatedAt');
    expect(paths).not.toContain('user.data.name');
  });

  it('handles array data values', () => {
    const ctx = {
      instruments: {
        data: ['AAPL', 'MSFT'],
        lastUpdatedAt: '2026',
      },
    };
    const paths = getContextPaths(ctx);
    expect(paths).toContain('instruments');
    expect(paths).toContain('instruments.lastUpdatedAt');
    expect(paths).not.toContain('instruments.data');
  });

  it('handles deeply nested objects inside data', () => {
    const ctx = {
      user: {
        data: { address: { city: 'Milan', zip: '20100' } },
      },
    };
    const paths = getContextPaths(ctx);
    expect(paths).toContain('user.address.city');
    expect(paths).toContain('user.address.zip');
  });
});

// ─── resolveText ─────────────────────────────────────────────────────────────

describe('resolveText', () => {
  const ctx = {
    user: {
      data: { name: 'Andrea' },
    },
    items: {
      data: ['A', 'B', 'C'],
    },
  };

  it('resolves simple placeholders', () => {
    expect(resolveText('Hello :::user.name!', ctx)).toBe('Hello Andrea!');
  });

  it('resolves array with default comma format', () => {
    expect(resolveText('Items: :::items', ctx)).toBe('Items: A, B, C');
  });

  it('resolves array with inline newline format', () => {
    expect(resolveText('Items: :::items|newline', ctx)).toBe('Items: A\nB\nC');
  });

  it('resolves array with inline custom format', () => {
    expect(resolveText('Items: :::items|custom(; )', ctx)).toBe('Items: A; B; C');
  });

  it('resolves array with inline json format', () => {
    expect(resolveText('Items: :::items|json', ctx)).toBe('Items: ["A","B","C"]');
  });

  it('leaves unresolved placeholders as-is', () => {
    expect(resolveText(':::missing.key', ctx)).toBe(':::missing.key');
  });

  it('resolves multiple placeholders in one string', () => {
    const text = ':::user.name has :::items|json';
    expect(resolveText(text, ctx)).toBe('Andrea has ["A","B","C"]');
  });

  it('works with flat context when dataKey is null', () => {
    const flat = { name: 'Bob' };
    expect(
      resolveText('Hello :::name', flat, undefined, undefined, undefined, null),
    ).toBe('Hello Bob');
  });
});

// ─── resolveConfig ───────────────────────────────────────────────────────────

describe('resolveConfig', () => {
  const ctx = {
    user: {
      data: { name: 'Andrea', email: 'a@b.com' },
    },
    auth: {
      data: { token: 'abc123' },
    },
    instruments: {
      data: ['AAPL', 'MSFT'],
    },
  };

  it('resolves all string values in a flat config', () => {
    const config = {
      greeting: 'Hello :::user.name',
      token: ':::auth.token',
    };
    const result = resolveConfig(config, ctx);
    expect(result.greeting).toBe('Hello Andrea');
    expect(result.token).toBe('abc123');
  });

  it('preserves non-string values', () => {
    const config = {
      count: 42,
      active: true,
      nothing: null,
    };
    const result = resolveConfig(config, ctx);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.nothing).toBe(null);
  });

  it('resolves deeply nested config values', () => {
    const config = {
      a: { b: { c: 'User: :::user.name' } },
    };
    const result = resolveConfig(config, ctx);
    expect((result.a as any).b.c).toBe('User: Andrea');
  });

  it('resolves values inside arrays', () => {
    const config = {
      messages: ['Hello :::user.name', 'Token: :::auth.token'],
    };
    const result = resolveConfig(config, ctx);
    expect((result.messages as string[])[0]).toBe('Hello Andrea');
    expect((result.messages as string[])[1]).toBe('Token: abc123');
  });

  it('resolves array placeholders with inline format', () => {
    const config = {
      list: 'Instruments: :::instruments|newline',
    };
    const result = resolveConfig(config, ctx);
    expect(result.list).toBe('Instruments: AAPL\nMSFT');
  });

  it('does not mutate the original config', () => {
    const config = { name: ':::user.name' };
    const original = JSON.stringify(config);
    resolveConfig(config, ctx);
    expect(JSON.stringify(config)).toBe(original);
  });

  it('leaves unresolved placeholders as-is', () => {
    const config = { msg: ':::missing.value' };
    const result = resolveConfig(config, ctx);
    expect(result.msg).toBe(':::missing.value');
  });

  it('works with flat context when dataKey is null', () => {
    const flat = { name: 'Bob' };
    const config = { greeting: 'Hi :::name' };
    const result = resolveConfig(config, flat, { dataKey: null });
    expect(result.greeting).toBe('Hi Bob');
  });

  it('handles a realistic trading config', () => {
    const config = {
      method: 'POST',
      url: '/api/webhook',
      headers: {
        Authorization: 'Bearer :::auth.token',
      },
      body: {
        message: 'Hello :::user.name, instruments: :::instruments|custom(, )',
        recipients: [
          { email: ':::user.email' },
        ],
      },
    };
    const result = resolveConfig(config, ctx);
    expect((result.headers as any).Authorization).toBe('Bearer abc123');
    expect((result.body as any).message).toBe('Hello Andrea, instruments: AAPL, MSFT');
    expect((result.body as any).recipients[0].email).toBe('a@b.com');
  });
});
