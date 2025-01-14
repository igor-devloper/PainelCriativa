-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('WAITING', 'RECEIVED', 'ACCEPTED', 'DENIED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('OPEN', 'CLOSED', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('WAITING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRANSPORT', 'ACCOMMODATION', 'SUPPLIES', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'PIX', 'OTHER');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'WAITING',
    "userId" TEXT NOT NULL,
    "financeId" TEXT,
    "expectedDate" TIMESTAMP(3),
    "denialReason" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "blockId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'WAITING',
    "userId" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingBlock_code_key" ON "AccountingBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingBlock_requestId_key" ON "AccountingBlock"("requestId");

-- AddForeignKey
ALTER TABLE "AccountingBlock" ADD CONSTRAINT "AccountingBlock_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "AccountingBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
