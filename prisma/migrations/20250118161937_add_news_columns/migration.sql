/*
  Warnings:

  - Added the required column `currentBalance` to the `AccountingBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialAmount` to the `AccountingBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceDeducted` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialUserBalance` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AccountingBlock" ADD COLUMN     "currentBalance" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "initialAmount" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "balanceDeducted" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "initialUserBalance" DECIMAL(10,2) NOT NULL;
