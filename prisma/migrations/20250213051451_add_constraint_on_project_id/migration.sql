/*
  Warnings:

  - Made the column `projectId` on table `Story` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "projectId" SET NOT NULL;
