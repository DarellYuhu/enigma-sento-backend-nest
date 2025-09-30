-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_contentDistributionId_fkey";

-- DropForeignKey
ALTER TABLE "ContentFile" DROP CONSTRAINT "ContentFile_contentId_fkey";

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_contentDistributionId_fkey" FOREIGN KEY ("contentDistributionId") REFERENCES "ContentDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFile" ADD CONSTRAINT "ContentFile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
