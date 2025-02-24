/*
  Warnings:

  - A unique constraint covering the columns `[name,workgroupUserId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ContentDistribution" DROP CONSTRAINT "ContentDistribution_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_projectId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_workgroupUserId_key" ON "Project"("name", "workgroupUserId");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
