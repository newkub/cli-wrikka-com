// Base types
export interface Theme {
  colors: {
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    muted: string;
    text: {
      primary: string;
      secondary: string;
      inverted: string;
      disabled: string;
      error: string;
      success: string;
    };
    background: {
      default: string;
      paper: string;
    };
    border: {
      default: string;
      focus: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    lineHeight: {
      sm: number;
      md: number;
      lg: number;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  zIndex: {
    dropdown: number;
    modal: number;
    tooltip: number;
  };
}

export interface PromptOptions<T = unknown> {
  message: string;
  initialValue?: T;
  required?: boolean;
  validate?: (value: T) => string | undefined | Promise<string | undefined>;
  theme?: Partial<Theme>;
}

export interface TextPromptOptions extends PromptOptions<string> {
  defaultValue?: string;
  placeholder?: string;
  mask?: string | ((value: string) => string);
}

export interface ConfirmPromptOptions extends PromptOptions<boolean> {
  initialValue?: boolean;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface SelectPromptOptions<T = string> extends Omit<PromptOptions<T>, 'initialValue'> {
  options: SelectOption<T>[];
  initialValue?: T;
}

export interface MultiSelectPromptOptions<T = string> extends Omit<PromptOptions<T[]>, 'initialValue'> {
  options: SelectOption<T>[];
  initialValue?: T[];
  min?: number;
  max?: number;
}

export interface TogglePromptOptions extends PromptOptions<boolean> {
  initialValue?: boolean;
}

export interface PasswordPromptOptions extends Omit<PromptOptions<string>, 'initialValue'> {
  mask?: string;
  confirm?: boolean;
  initialValue?: string;
}

export interface AutocompletePromptOptions<T = string> 
  extends Omit<PromptOptions<T>, 'initialValue'> {
  source: (input: string) => Promise<Array<{ value: T; label: string }>> | Array<{ value: T; label: string }>;
  initialValue?: T;
  minInputLength?: number;
  debounce?: number;
}

export interface TaskOptions {
  title: string;
  task: () => Promise<void> | void;
  skip?: boolean | (() => boolean | Promise<boolean>);
  retry?: number;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: number;
  format?: (value: unknown, row: T) => string;
}

export interface TableOptions<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  border?: boolean;
  header?: boolean;
  padding?: number;
  maxWidth?: number;
}

export interface SearchOptions<T = unknown> {
  source: (query: string) => Promise<T[]> | T[];
  debounce?: number;
  minQueryLength?: number;
  limit?: number;
  renderItem?: (item: T) => string;
  onSelect?: (item: T) => void;
}
