/*
  Warnings:

  - You are about to drop the column `storyPerPage` on the `Workgroup` table. All the data in the column will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workgroupId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectStoryPerUser` to the `Workgroup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_storyId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "workgroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "section" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workgroup" DROP COLUMN "storyPerPage",
ADD COLUMN     "projectStoryPerUser" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Section";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
