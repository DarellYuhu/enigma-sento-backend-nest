-- DropForeignKey
ALTER TABLE "ContentDistribution" DROP CONSTRAINT "ContentDistribution_storyId_fkey";

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "isGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ContentDistribution" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
