type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: ShortcutHandler;
  description: string;
}

class KeyboardShortcuts {
  private shortcuts: Map<string, Shortcut> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public register(shortcut: Shortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  public unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getRegisteredShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  private getShortcutKey(shortcut: Shortcut): string {
    const modifiers: string[] = [];
    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.metaKey) modifiers.push('meta');
    return [...modifiers, shortcut.key.toLowerCase()].join('+');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = event.key.toLowerCase();
    const shortcutKey = this.getShortcutKey({
      key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      handler: () => {},
      description: '',
    });

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      shortcut.handler(event);
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

// Create a singleton instance
const keyboardShortcuts = new KeyboardShortcuts();

// Export common shortcuts
const registerCommonShortcuts = () => {
  // Navigation
  keyboardShortcuts.register({
    key: 'h',
    ctrlKey: true,
    handler: () => window.location.href = '/',
    description: 'Go to Home',
  });

  keyboardShortcuts.register({
    key: 'd',
    ctrlKey: true,
    handler: () => window.location.href = '/dashboard',
    description: 'Go to Dashboard',
  });

  // Actions
  keyboardShortcuts.register({
    key: 's',
    ctrlKey: true,
    handler: () => {
      // Trigger save action
      const event = new CustomEvent('save');
      window.dispatchEvent(event);
    },
    description: 'Save',
  });

  keyboardShortcuts.register({
    key: 'f',
    ctrlKey: true,
    handler: () => {
      // Trigger search/filter
      const event = new CustomEvent('search');
      window.dispatchEvent(event);
    },
    description: 'Search',
  });

  // Toggle panels
  keyboardShortcuts.register({
    key: '1',
    ctrlKey: true,
    handler: () => {
      const event = new CustomEvent('toggle-panel', { detail: 'system' });
      window.dispatchEvent(event);
    },
    description: 'Toggle System Panel',
  });

  keyboardShortcuts.register({
    key: '2',
    ctrlKey: true,
    handler: () => {
      const event = new CustomEvent('toggle-panel', { detail: 'mission' });
      window.dispatchEvent(event);
    },
    description: 'Toggle Mission Panel',
  });

  keyboardShortcuts.register({
    key: '3',
    ctrlKey: true,
    handler: () => {
      const event = new CustomEvent('toggle-panel', { detail: 'telemetry' });
      window.dispatchEvent(event);
    },
    description: 'Toggle Telemetry Panel',
  });

  // Expert mode
  keyboardShortcuts.register({
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    handler: () => {
      const event = new CustomEvent('toggle-expert-mode');
      window.dispatchEvent(event);
    },
    description: 'Toggle Expert Mode',
  });

  // Help
  keyboardShortcuts.register({
    key: '?',
    handler: () => {
      const event = new CustomEvent('show-shortcuts');
      window.dispatchEvent(event);
    },
    description: 'Show Keyboard Shortcuts',
  });
};

// Export the singleton instance and registration function
export { keyboardShortcuts as default, registerCommonShortcuts }; 