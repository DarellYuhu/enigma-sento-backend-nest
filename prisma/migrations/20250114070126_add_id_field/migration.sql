/*
  Warnings:

  - Added the required column `workgroupId` to the `TaskHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskHistory" ADD COLUMN     "workgroupId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
