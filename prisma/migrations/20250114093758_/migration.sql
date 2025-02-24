-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "contentPerStory" INTEGER;

-- CreateTable
CREATE TABLE "ContentDistribution" (
    "session" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "workgroupId" TEXT NOT NULL,
    "groupDistributionCode" TEXT NOT NULL,
    "storyId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentDistribution_workgroupId_groupDistributionCode_story_key" ON "ContentDistribution"("workgroupId", "groupDistributionCode", "storyId", "session");

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_groupDistributionCode_fkey" FOREIGN KEY ("groupDistributionCode") REFERENCES "GroupDistribution"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
