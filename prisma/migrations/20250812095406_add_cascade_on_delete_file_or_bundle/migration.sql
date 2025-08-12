-- DropForeignKey
ALTER TABLE "BundleFile" DROP CONSTRAINT "BundleFile_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "BundleFile" DROP CONSTRAINT "BundleFile_fileId_fkey";

-- AddForeignKey
ALTER TABLE "BundleFile" ADD CONSTRAINT "BundleFile_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleFile" ADD CONSTRAINT "BundleFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
