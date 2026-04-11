-- AlterEnum
ALTER TYPE "ChangeOrderStatus" ADD VALUE 'COUNTERED';

-- AlterTable
ALTER TABLE "change_orders" ADD COLUMN "counterAmount" DECIMAL(12,2),
ADD COLUMN "counterReason" TEXT;
