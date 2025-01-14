/*
  Warnings:

  - You are about to drop the column `responsibleCompany` on the `Request` table. All the data in the column will be lost.
  - Added the required column `currentBalance` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "responsibleCompany",
ADD COLUMN     "currentBalance" DECIMAL(10,2) NOT NULL;
