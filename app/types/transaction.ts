import { Transaction as PrismaTransaction } from "@prisma/client";

export interface Transaction extends PrismaTransaction {
  imageUrl: string[];
}