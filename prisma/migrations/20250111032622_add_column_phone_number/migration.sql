/*
  Warnings:

  - Added the required column `phoneNumber` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "phoneNumber" TEXT NOT NULL;
