-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "captionFileId" INTEGER,
ADD COLUMN     "notes" TEXT;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_captionFileId_fkey" FOREIGN KEY ("captionFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
