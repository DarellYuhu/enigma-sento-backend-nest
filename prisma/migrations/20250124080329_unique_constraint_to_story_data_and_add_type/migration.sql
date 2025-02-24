/*
  Warnings:

  - Changed the type of `type` on the `Story` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('GENERATE', 'GENERATED');

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "data" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "StoryType" NOT NULL;
