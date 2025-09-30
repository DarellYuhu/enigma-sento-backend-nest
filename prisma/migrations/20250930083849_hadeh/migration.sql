-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_storyId_fkey";

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
