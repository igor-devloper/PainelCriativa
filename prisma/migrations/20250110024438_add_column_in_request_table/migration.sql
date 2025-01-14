/*
  Warnings:

  - Added the required column `enterprise` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "enterprise" TEXT NOT NULL;
