import { create } from "zustand";
import { canvasHistory } from "@/lib/canvas-history";
import { createElementsSlice, type ElementsSlice } from "./slices/elements-slice";
import { createSelectionSlice, type SelectionSlice } from "./slices/selection-slice";
import { createToolSlice, type ToolSlice } from "./slices/tool-slice";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";

export type CanvasStore = ElementsSlice & SelectionSlice & ToolSlice & UiSlice;

export const useCanvasStore = create<CanvasStore>()((...a) => ({
  ...createElementsSlice(...a),
  ...createSelectionSlice(...a),
  ...createToolSlice(...a),
  ...createUiSlice(...a),
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

useCanvasStore.subscribe((state, prevState) => {
  if (state.elements !== prevState.elements && !state.isRestoringFromHistory) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      canvasHistory.push({
        elements: state.elements,
        canvasBackground: state.canvasBackground,
        canvasBackgroundVisible: state.canvasBackgroundVisible,
      });
      saveTimeout = null;
    }, DEBOUNCE_MS);
  }
});
