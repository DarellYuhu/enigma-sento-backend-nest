-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "contentDistributionId" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFile" (
    "contentId" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentFile_contentId_fileId_key" ON "ContentFile"("contentId", "fileId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_contentDistributionId_fkey" FOREIGN KEY ("contentDistributionId") REFERENCES "ContentDistribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFile" ADD CONSTRAINT "ContentFile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFile" ADD CONSTRAINT "ContentFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
