-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('FINISHED', 'WAITING');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "TransactionStatus" DEFAULT 'WAITING';
