import { create } from "zustand";

interface PaletteState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export const useCommandPalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));
