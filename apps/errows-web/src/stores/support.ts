import { create } from 'zustand';

interface SupportDialogState {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useSupportDialog = create<SupportDialogState>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false }),
}));

