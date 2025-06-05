/*
  Warnings:

  - The values [RECEIVED,ACCEPTED,DENIED] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DESPESA', 'CAIXA', 'REEMBOLSO');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('REIMBURSEMENT', 'DEPOSIT');

-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE 'OFFICESUPPLIES';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('WAITING', 'VALIDATES', 'AUTHORIZES', 'ACCEPTS', 'COMPLETED');
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'WAITING';
COMMIT;

-- AlterTable
ALTER TABLE "AccountingBlock" ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "saldoFinal" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'DESPESA';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "accountType" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "gestor" TEXT,
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "responsibleValidationUserID" TEXT,
ADD COLUMN     "type" "RequestType";
