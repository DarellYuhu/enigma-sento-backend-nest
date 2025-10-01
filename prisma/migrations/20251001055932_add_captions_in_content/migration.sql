-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "captions" TEXT[];

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isTmp" BOOLEAN NOT NULL DEFAULT false;
