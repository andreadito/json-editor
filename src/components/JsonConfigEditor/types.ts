export interface EditableField {
  path: string;
  value: string;
  key: string;
  hasPlaceholders: boolean;
  isLong: boolean;
}

export type FieldFilter = 'all' | 'placeholders' | 'long';

export interface JsonConfigEditorProps {
  /** Initial JSON configuration object */
  initialValue: Record<string, unknown>;
  /** Called whenever the config changes (from either the code editor or field editor) */
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
}
