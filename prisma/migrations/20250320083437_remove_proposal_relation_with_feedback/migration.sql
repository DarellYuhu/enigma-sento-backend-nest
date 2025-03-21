/*
  Warnings:

  - You are about to drop the column `proposalId` on the `Feedback` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_proposalId_fkey";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "proposalId";
