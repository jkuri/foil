import { get, set } from "idb-keyval";
import type { CanvasElement } from "@/types";

const DB_KEY = "canvas-history";
const MAX_HISTORY_SIZE = 50;

export interface CanvasSnapshot {
  elements: CanvasElement[];
  canvasBackground: string;
  canvasBackgroundVisible: boolean;
  timestamp: number;
}

interface HistoryData {
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];
  current: CanvasSnapshot | null;
}

class CanvasHistoryManager {
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  private current: CanvasSnapshot | null = null;

  /**
   * Push a new snapshot to history. Clears redo stack.
   */
  push(snapshot: Omit<CanvasSnapshot, "timestamp">): void {
    const fullSnapshot: CanvasSnapshot = {
      ...snapshot,
      timestamp: Date.now(),
    };

    // If we have a current state, move it to undo stack
    if (this.current) {
      this.undoStack.push(this.current);
      // Limit stack size
      if (this.undoStack.length > MAX_HISTORY_SIZE) {
        this.undoStack.shift();
      }
    }

    this.current = fullSnapshot;
    this.redoStack = []; // Clear redo on new action
    this.scheduleSave();
  }

  /**
   * Undo: Move current to redo stack, pop from undo stack
   */
  undo(): CanvasSnapshot | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    // Move current to redo
    if (this.current) {
      this.redoStack.push(this.current);
    }

    // Pop from undo
    this.current = this.undoStack.pop() || null;
    this.scheduleSave();
    return this.current;
  }

  /**
   * Redo: Move current to undo stack, pop from redo stack
   */
  redo(): CanvasSnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    // Move current to undo
    if (this.current) {
      this.undoStack.push(this.current);
    }

    // Pop from redo
    this.current = this.redoStack.pop() || null;
    this.scheduleSave();
    return this.current;
  }

  /**
   * Get current snapshot without modifying history
   */
  getCurrent(): CanvasSnapshot | null {
    return this.current;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Schedule a debounced save to IndexedDB
   */
  private scheduleSave(): void {
    this.saveToIndexedDB();
  }

  /**
   * Save history to IndexedDB
   */
  async saveToIndexedDB(): Promise<void> {
    try {
      const data: HistoryData = {
        undoStack: this.undoStack,
        redoStack: this.redoStack,
        current: this.current,
      };
      await set(DB_KEY, data);
    } catch (error) {
      console.error("Failed to save history to IndexedDB:", error);
    }
  }

  /**
   * Load history from IndexedDB
   */
  async loadFromIndexedDB(): Promise<CanvasSnapshot | null> {
    try {
      const data = await get<HistoryData>(DB_KEY);
      if (data) {
        this.undoStack = data.undoStack || [];
        this.redoStack = data.redoStack || [];
        this.current = data.current || null;
        return this.current;
      }
    } catch (error) {
      console.error("Failed to load history from IndexedDB:", error);
    }
    return null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.current = null;
    this.scheduleSave();
  }
}

// Export singleton instance
export const canvasHistory = new CanvasHistoryManager();
