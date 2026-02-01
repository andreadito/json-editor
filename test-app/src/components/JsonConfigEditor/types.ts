export interface EditableField {
  path: string;
  value: string;
  key: string;
  hasPlaceholders: boolean;
  isLong: boolean;
}

export type FieldFilter = 'all' | 'placeholders' | 'long';

export type ArrayFormat = 'comma' | 'newline' | 'json' | 'custom';

export interface JsonConfigEditorProps {
  /** Initial JSON configuration object */
  initialValue: Record<string, unknown>;
  /** Called when user explicitly clicks "Save" in the header. Use this for on-demand persistence. */
  onSave?: (config: Record<string, unknown>) => void;
  /** Called whenever the config changes (every edit). Optional — omit for on-demand-only via onSave. */
  onChange?: (config: Record<string, unknown>) => void;
  /** Called when user clicks "Get Stringified Output" */
  onExport?: (jsonString: string) => void;
  /** Placeholder regex pattern. Defaults to /:::([\w.]+)/g */
  placeholderPattern?: RegExp;
  /** Quick-insert placeholder suggestions shown in the field editor */
  quickPlaceholders?: string[];
  /** Title shown in the header */
  title?: string;
  /** Height of the editor. Defaults to '100vh' */
  height?: string | number;
  /** Context object used to resolve placeholder values in preview (e.g. { foo: "bar", parent: { sub: 1 } }) */
  placeholderContext?: Record<string, unknown>;
  /** Default array rendering format for resolved placeholders. Defaults to 'comma' */
  defaultArrayFormat?: ArrayFormat;
  /** Custom separator string used when arrayFormat is 'custom'. Defaults to ' | ' */
  customArraySeparator?: string;
  /**
   * Key inside each top-level context entry that holds the actual data.
   * Defaults to 'data'.
   *
   * Given context `{ contextA: { data: { foo: "bar" }, lastUpdatedAt: "..." } }`,
   * the placeholder `:::contextA.foo` resolves to `context.contextA.data.foo`
   * without the user having to write `:::contextA.data.foo`.
   *
   * Set to `undefined` or `null` to disable auto-drill (flat context).
   */
  contextDataKey?: string | null;
}
