import type { StateCreator } from "zustand";
import type { LinearGradient, RadialGradient } from "@/types";

export interface GradientSlice {
  gradients: Map<string, LinearGradient | RadialGradient>;

  addGradient: (gradient: LinearGradient | RadialGradient) => string;
  updateGradient: (id: string, updates: Partial<LinearGradient | RadialGradient>) => void;
  deleteGradient: (id: string) => void;
  getGradient: (id: string) => LinearGradient | RadialGradient | undefined;
  setGradients: (gradients: Map<string, LinearGradient | RadialGradient>) => void;
}

export const createGradientSlice: StateCreator<GradientSlice, [], [], GradientSlice> = (set, get) => ({
  gradients: new Map(),

  addGradient: (gradient) => {
    const id = gradient.id || crypto.randomUUID();
    const gradientWithId = { ...gradient, id };

    set((state) => {
      const newGradients = new Map(state.gradients);
      newGradients.set(id, gradientWithId);
      return { gradients: newGradients };
    });

    return id;
  },

  updateGradient: (id, updates) =>
    set((state) => {
      const existing = state.gradients.get(id);
      if (!existing) return state;

      const newGradients = new Map(state.gradients);
      newGradients.set(id, { ...existing, ...updates } as LinearGradient | RadialGradient);
      return { gradients: newGradients };
    }),

  deleteGradient: (id) =>
    set((state) => {
      const newGradients = new Map(state.gradients);
      newGradients.delete(id);
      return { gradients: newGradients };
    }),

  getGradient: (id) => {
    return get().gradients.get(id);
  },

  setGradients: (gradients) => set({ gradients }),
});
