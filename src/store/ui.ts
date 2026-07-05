import { create } from "zustand";

/** Estado de UI transitório (não sincroniza pela rede). */
interface UIState {
  manualOpen: boolean;
  openManual: () => void;
  closeManual: () => void;
}

export const useUI = create<UIState>((set) => ({
  manualOpen: false,
  openManual: () => set({ manualOpen: true }),
  closeManual: () => set({ manualOpen: false }),
}));
