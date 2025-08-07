/*
  Warnings:

  - Made the column `bucket` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullPath` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "bucket" SET NOT NULL,
ALTER COLUMN "fullPath" SET NOT NULL;
