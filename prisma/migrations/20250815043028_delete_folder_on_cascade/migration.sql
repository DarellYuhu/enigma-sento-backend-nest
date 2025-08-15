-- DropForeignKey
ALTER TABLE "Bundle" DROP CONSTRAINT "Bundle_folderId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedGroup" DROP CONSTRAINT "GeneratedGroup_folderId_fkey";

-- AddForeignKey
ALTER TABLE "GeneratedGroup" ADD CONSTRAINT "GeneratedGroup_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
