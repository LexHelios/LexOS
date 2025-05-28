export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacings: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
  radii: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    inner: string;
    none: string;
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  zIndices: {
    0: number;
    10: number;
    20: number;
    30: number;
    40: number;
    50: number;
    auto: string;
  };
  transitions: {
    default: string;
    fast: string;
    slow: string;
  };
  animations: {
    spin: string;
    ping: string;
    pulse: string;
    bounce: string;
  };
} 