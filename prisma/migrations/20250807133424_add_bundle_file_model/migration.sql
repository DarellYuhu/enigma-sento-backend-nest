/*
  Warnings:

  - Added the required column `fileId` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "fileId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BundleFile" (
    "bundleId" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BundleFile_bundleId_fileId_key" ON "BundleFile"("bundleId", "fileId");

-- AddForeignKey
ALTER TABLE "BundleFile" ADD CONSTRAINT "BundleFile_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleFile" ADD CONSTRAINT "BundleFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
