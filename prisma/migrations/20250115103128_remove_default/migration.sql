-- AlterTable
ALTER TABLE "WorkgroupUserTask" ALTER COLUMN "workgroupUserId" DROP DEFAULT;
DROP SEQUENCE "WorkgroupUserTask_workgroupUserId_seq";
