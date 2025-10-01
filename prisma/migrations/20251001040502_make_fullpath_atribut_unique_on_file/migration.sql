/*
  Warnings:

  - A unique constraint covering the columns `[fullPath]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_fullPath_key" ON "File"("fullPath");
