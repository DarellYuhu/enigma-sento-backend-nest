/*
  Warnings:

  - The values [DRAFT_ONLY] on the enum `StoryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StoryType_new" AS ENUM ('USER_GENERATE', 'SYSTEM_GENERATE');
ALTER TABLE "Story" ALTER COLUMN "type" TYPE "StoryType_new" USING ("type"::text::"StoryType_new");
ALTER TYPE "StoryType" RENAME TO "StoryType_old";
ALTER TYPE "StoryType_new" RENAME TO "StoryType";
DROP TYPE "StoryType_old";
COMMIT;
