/*
  Warnings:

  - A unique constraint covering the columns `[userId,company]` on the table `UserBalance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company` to the `AccountingBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company` to the `UserBalance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AccountingBlock" ADD COLUMN     "company" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "company" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserBalance" ADD COLUMN     "company" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserBalance_userId_company_key" ON "UserBalance"("userId", "company");
