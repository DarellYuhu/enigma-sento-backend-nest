/*
  Warnings:

  - You are about to drop the column `captions` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `contentPerStory` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `generatorStatus` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `hashtags` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "captions",
DROP COLUMN "contentPerStory",
DROP COLUMN "data",
DROP COLUMN "generatorStatus",
DROP COLUMN "hashtags",
DROP COLUMN "section",
DROP COLUMN "type";
