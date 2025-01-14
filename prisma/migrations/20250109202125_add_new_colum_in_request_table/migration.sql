/*
  Warnings:

  - The values [FOOD,TRANSPORT,SERVICES] on the enum `ExpenseCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseCategory_new" AS ENUM ('FOODANDBEVERAGE', 'ACCOMMODATION', 'TOLL', 'FREIGHT', 'POSTAGE', 'PRINTING', 'FUEL', 'VEHICLERENTAL', 'TICKET', 'AIRTICKET', 'BUSTICKET', 'VEHICLEWASH', 'ADVANCE', 'SUPPLIES', 'OTHER');
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE "ExpenseCategory_new" USING ("category"::text::"ExpenseCategory_new");
ALTER TYPE "ExpenseCategory" RENAME TO "ExpenseCategory_old";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";
DROP TYPE "ExpenseCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "responsibleCompany" TEXT;
