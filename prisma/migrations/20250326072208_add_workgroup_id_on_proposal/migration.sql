/*
  Warnings:

  - Made the column `workgroupId` on table `Proposal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_workgroupId_fkey";

-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "workgroupId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
