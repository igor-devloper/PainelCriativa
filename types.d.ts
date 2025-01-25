declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
export type UserRole = "ADMIN" | "USER" | "FINANCE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: Date;
}
