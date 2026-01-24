import { create } from "zustand";
import { canvasHistory } from "@/lib/canvas-history";
import { createElementsSlice, type ElementsSlice } from "./slices/elements-slice";
import { createGradientSlice, type GradientSlice } from "./slices/gradient-slice";
import { createSelectionSlice, type SelectionSlice } from "./slices/selection-slice";
import { createToolSlice, type ToolSlice } from "./slices/tool-slice";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";

export type CanvasStore = ElementsSlice & SelectionSlice & ToolSlice & UiSlice & GradientSlice;

export const useCanvasStore = create<CanvasStore>()((...a) => ({
  ...createElementsSlice(...a),
  ...createSelectionSlice(...a),
  ...createToolSlice(...a),
  ...createUiSlice(...a),
  ...createGradientSlice(...a),
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

useCanvasStore.subscribe((state, prevState) => {
  const elementsChanged = state.elements !== prevState.elements;
  const gradientsChanged = state.gradients !== prevState.gradients;

  if ((elementsChanged || gradientsChanged) && !state.isRestoringFromHistory) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      canvasHistory.push({
        elements: state.elements,
        canvasBackground: state.canvasBackground,
        canvasBackgroundVisible: state.canvasBackgroundVisible,
        gradients: state.gradients,
      });
      saveTimeout = null;
    }, DEBOUNCE_MS);
  }
});
