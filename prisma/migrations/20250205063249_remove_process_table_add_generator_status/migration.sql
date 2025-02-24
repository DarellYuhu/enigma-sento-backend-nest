/*
  Warnings:

  - You are about to drop the `ScriptProcess` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GeneratorStatus" AS ENUM ('NOT_GENERATE', 'RUNNING', 'FINNISHED', 'ERROR');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "generatorStatus" "GeneratorStatus" NOT NULL DEFAULT 'NOT_GENERATE';

-- DropTable
DROP TABLE "ScriptProcess";

-- DropEnum
DROP TYPE "ProcessStatus";
