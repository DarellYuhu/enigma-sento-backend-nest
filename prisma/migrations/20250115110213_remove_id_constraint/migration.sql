/*
  Warnings:

  - The primary key for the `WorkgroupUserTask` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "WorkgroupUserTask" DROP CONSTRAINT "WorkgroupUserTask_pkey";
