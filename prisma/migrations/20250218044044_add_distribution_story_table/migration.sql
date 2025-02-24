/*
  Warnings:

  - A unique constraint covering the columns `[workgroupId,groupDistributionCode,session,storyId]` on the table `ContentDistribution` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `ContentDistribution` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('SPECIFIC', 'GENERIC');

-- DropIndex
DROP INDEX "ContentDistribution_workgroupId_groupDistributionCode_story_key";

-- AlterTable
ALTER TABLE "ContentDistribution" ADD COLUMN "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "storyId" DROP NOT NULL;

-- Backfill existing records with UUID
UPDATE "ContentDistribution" 
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;

-- Make "id" the new primary key
ALTER TABLE "ContentDistribution" 
ADD CONSTRAINT "ContentDistribution_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "allocationType" "AllocationType" NOT NULL DEFAULT 'SPECIFIC';

-- CreateTable
CREATE TABLE "DistributionStory" (
    "contentDistributionId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "amountOfContents" INTEGER NOT NULL,
    "offset" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DistributionStory_contentDistributionId_storyId_key" ON "DistributionStory"("contentDistributionId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentDistribution_workgroupId_groupDistributionCode_sessi_key" ON "ContentDistribution"("workgroupId", "groupDistributionCode", "session", "storyId");

-- AddForeignKey
ALTER TABLE "DistributionStory" ADD CONSTRAINT "DistributionStory_contentDistributionId_fkey" FOREIGN KEY ("contentDistributionId") REFERENCES "ContentDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStory" ADD CONSTRAINT "DistributionStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
