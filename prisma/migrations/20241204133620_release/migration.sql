/*
  Warnings:

  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Changed the type of `status` on the `Block` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `category` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'EXPENSE', 'REFUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('WAITING', 'FINISHED');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('OPEN', 'CLOSED', 'APPROVED');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('FOOD', 'UTILITY', 'OTHER', 'GASOLINE', 'ADVANCE');

-- CreateEnum
CREATE TYPE "TransactionPaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'PIX', 'OTHER');

-- AlterTable
ALTER TABLE "Block" DROP COLUMN "status",
ADD COLUMN     "status" "BlockStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "category" "TransactionCategory" NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "imageUrl" TEXT[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" "TransactionPaymentMethod" NOT NULL,
ADD COLUMN     "status" "TransactionStatus" DEFAULT 'WAITING',
ADD COLUMN     "type" "TransactionType" NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "description" DROP NOT NULL;
