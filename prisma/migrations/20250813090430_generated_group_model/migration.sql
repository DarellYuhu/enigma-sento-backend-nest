/*
  Warnings:

  - You are about to drop the column `groups` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "groups";

-- CreateTable
CREATE TABLE "GeneratedGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groups" TEXT[],
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedGroup_name_key" ON "GeneratedGroup"("name");

-- AddForeignKey
ALTER TABLE "GeneratedGroup" ADD CONSTRAINT "GeneratedGroup_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
