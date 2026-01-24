import { get, set } from "idb-keyval";
import type { CanvasElement, LinearGradient, RadialGradient } from "@/types";

const DB_KEY = "canvas-history";
const MAX_HISTORY_SIZE = 50;

export interface CanvasSnapshot {
  elements: CanvasElement[];
  canvasBackground: string;
  canvasBackgroundVisible: boolean;
  gradients?: Map<string, LinearGradient | RadialGradient>;
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

  push(snapshot: Omit<CanvasSnapshot, "timestamp">): void {
    const fullSnapshot: CanvasSnapshot = {
      ...snapshot,
      timestamp: Date.now(),
    };

    if (this.current) {
      this.undoStack.push(this.current);

      if (this.undoStack.length > MAX_HISTORY_SIZE) {
        this.undoStack.shift();
      }
    }

    this.current = fullSnapshot;
    this.redoStack = [];
    this.scheduleSave();
  }

  undo(): CanvasSnapshot | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    if (this.current) {
      this.redoStack.push(this.current);
    }

    this.current = this.undoStack.pop() || null;
    this.scheduleSave();
    return this.current;
  }

  redo(): CanvasSnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    if (this.current) {
      this.undoStack.push(this.current);
    }

    this.current = this.redoStack.pop() || null;
    this.scheduleSave();
    return this.current;
  }

  getCurrent(): CanvasSnapshot | null {
    return this.current;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private scheduleSave(): void {
    this.saveToIndexedDB();
  }

  private serializeSnapshot(snapshot: CanvasSnapshot): CanvasSnapshot {
    return {
      ...snapshot,
      gradients: snapshot.gradients
        ? (Array.from(snapshot.gradients.entries()) as unknown as Map<string, LinearGradient | RadialGradient>)
        : undefined,
    };
  }

  private deserializeSnapshot(snapshot: CanvasSnapshot): CanvasSnapshot {
    return {
      ...snapshot,
      gradients: snapshot.gradients ? new Map(snapshot.gradients as unknown as [string, LinearGradient | RadialGradient][]) : undefined,
    };
  }

  async saveToIndexedDB(): Promise<void> {
    try {
      const data: HistoryData = {
        undoStack: this.undoStack.map((s) => this.serializeSnapshot(s)),
        redoStack: this.redoStack.map((s) => this.serializeSnapshot(s)),
        current: this.current ? this.serializeSnapshot(this.current) : null,
      };
      await set(DB_KEY, data);
    } catch (error) {
      console.error("Failed to save history to IndexedDB:", error);
    }
  }

  async loadFromIndexedDB(): Promise<CanvasSnapshot | null> {
    try {
      const data = await get<HistoryData>(DB_KEY);
      if (data) {
        this.undoStack = (data.undoStack || []).map((s) => this.deserializeSnapshot(s));
        this.redoStack = (data.redoStack || []).map((s) => this.deserializeSnapshot(s));
        this.current = data.current ? this.deserializeSnapshot(data.current) : null;
        return this.current;
      }
    } catch (error) {
      console.error("Failed to load history from IndexedDB:", error);
    }
    return null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.current = null;
    this.scheduleSave();
  }
}

export const canvasHistory = new CanvasHistoryManager();
