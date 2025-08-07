/*
  Warnings:

  - Added the required column `bucket` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullPath` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "bucket" TEXT;
ALTER TABLE "File" ADD COLUMN     "fullPath" TEXT;

UPDATE "File"
  SET
    bucket = split_part(path, '/', 2),
    path = regexp_replace(path, '^/[^/]+/', ''),
    "fullPath" = path; -- temporarily set to path for now
