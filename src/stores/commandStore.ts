import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Command {
  id: string;
  text: string;
  timestamp: number;
  status: "pending" | "running" | "completed" | "error";
  error?: string;
}

interface CommandState {
  commands: Command[];
  actions: {
    addCommand: (command: Omit<Command, "id" | "timestamp" | "status">) => void;
    updateCommand: (id: string, updates: Partial<Command>) => void;
    removeCommand: (id: string) => void;
    clearCommands: () => void;
  };
}

const useCommandStore = create<CommandState>()(
  devtools(
    (set) => ({
      commands: [],
      actions: {
        addCommand: (command) =>
          set((state) => ({
            commands: [
              ...state.commands,
              {
                ...command,
                id: Math.random().toString(36).substring(2, 9),
                timestamp: Date.now(),
                status: "pending",
              },
            ],
          })),
        updateCommand: (id, updates) =>
          set((state) => ({
            commands: state.commands.map((command) =>
              command.id === id ? { ...command, ...updates } : command
            ),
          })),
        removeCommand: (id) =>
          set((state) => ({
            commands: state.commands.filter((command) => command.id !== id),
          })),
        clearCommands: () =>
          set({
            commands: [],
          }),
      },
    }),
    {
      name: "command-store",
    }
  )
);

export default useCommandStore; 