/*
  Warnings:

  - You are about to drop the column `isDelete` on the `WorkgroupUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkgroupUser" DROP COLUMN "isDelete",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
