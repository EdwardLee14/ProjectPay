-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'COUNTER_PROPOSED';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "counterBudget" DECIMAL(12,2);
