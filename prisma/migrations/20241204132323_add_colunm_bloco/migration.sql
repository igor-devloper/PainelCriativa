/*
  Warnings:

  - You are about to drop the column `category` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to drop the `_BlockToTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `blockId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_BlockToTransaction" DROP CONSTRAINT "_BlockToTransaction_A_fkey";

-- DropForeignKey
ALTER TABLE "_BlockToTransaction" DROP CONSTRAINT "_BlockToTransaction_B_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
DROP COLUMN "date",
DROP COLUMN "imageUrl",
DROP COLUMN "name",
DROP COLUMN "paymentMethod",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "blockId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "description" SET NOT NULL;

-- DropTable
DROP TABLE "_BlockToTransaction";

-- DropEnum
DROP TYPE "TransactionCategory";

-- DropEnum
DROP TYPE "TransactionPaymentMethod";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
