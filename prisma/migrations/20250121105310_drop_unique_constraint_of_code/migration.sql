/*
  Warnings:

  - The primary key for the `GroupDistribution` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[code,workgroupId]` on the table `GroupDistribution` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `GroupDistribution` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('RUNNING', 'FINNISHED', 'ERROR');

-- DropForeignKey
ALTER TABLE "ContentDistribution" DROP CONSTRAINT "ContentDistribution_groupDistributionCode_fkey";

-- DropForeignKey
ALTER TABLE "WorkgroupUserTask" DROP CONSTRAINT "WorkgroupUserTask_groupDistributionId_fkey";

-- AlterTable
ALTER TABLE "GroupDistribution" DROP CONSTRAINT "GroupDistribution_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "GroupDistribution_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "ScriptProcess" (
    "id" TEXT NOT NULL,
    "status" "ProcessStatus" NOT NULL,
    "path" TEXT[],
    "runningStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runningEnd" TIMESTAMP(3),

    CONSTRAINT "ScriptProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupDistribution_code_workgroupId_key" ON "GroupDistribution"("code", "workgroupId");

-- AddForeignKey
ALTER TABLE "WorkgroupUserTask" ADD CONSTRAINT "WorkgroupUserTask_groupDistributionId_fkey" FOREIGN KEY ("groupDistributionId") REFERENCES "GroupDistribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_groupDistributionCode_fkey" FOREIGN KEY ("groupDistributionCode") REFERENCES "GroupDistribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
