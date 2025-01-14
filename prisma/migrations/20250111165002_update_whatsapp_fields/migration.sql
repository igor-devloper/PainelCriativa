/*
  Warnings:

  - You are about to drop the column `whatsappMessageSid` on the `Request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "whatsappMessageSid",
ADD COLUMN     "whatsappMessageError" TEXT,
ADD COLUMN     "whatsappMessageId" TEXT;
