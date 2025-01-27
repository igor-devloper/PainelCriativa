import { track } from "@vercel/analytics";

export const trackCreateRequest = (amount: number) => {
  track("Create Request", { amount });
};

export const trackCreateExpense = (amount: number, category: string) => {
  track("Create Expense", { amount, category });
};

export const trackCloseBlock = (blockCode: string, totalAmount: number) => {
  track("Close Block", { blockCode, totalAmount });
};
