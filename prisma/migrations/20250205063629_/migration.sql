/*
  Warnings:

  - The values [FINNISHED] on the enum `GeneratorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GeneratorStatus_new" AS ENUM ('NOT_GENERATE', 'RUNNING', 'FINISHED', 'ERROR');
ALTER TABLE "Story" ALTER COLUMN "generatorStatus" DROP DEFAULT;
ALTER TABLE "Story" ALTER COLUMN "generatorStatus" TYPE "GeneratorStatus_new" USING ("generatorStatus"::text::"GeneratorStatus_new");
ALTER TYPE "GeneratorStatus" RENAME TO "GeneratorStatus_old";
ALTER TYPE "GeneratorStatus_new" RENAME TO "GeneratorStatus";
DROP TYPE "GeneratorStatus_old";
ALTER TABLE "Story" ALTER COLUMN "generatorStatus" SET DEFAULT 'NOT_GENERATE';
COMMIT;
