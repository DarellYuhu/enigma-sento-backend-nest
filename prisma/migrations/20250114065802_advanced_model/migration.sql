/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "Workgroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "session" INTEGER NOT NULL,
    "storyPerPage" INTEGER NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkgroupUser" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "workgroupId" TEXT NOT NULL,

    CONSTRAINT "WorkgroupUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDistribution" (
    "code" TEXT NOT NULL,
    "amontOfTroops" INTEGER NOT NULL,
    "workgroupId" TEXT NOT NULL,

    CONSTRAINT "GroupDistribution_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkgroupUserTask" (
    "workgroupUserId" SERIAL NOT NULL,
    "groupDistributionId" TEXT NOT NULL,
    "taskHistoryId" INTEGER NOT NULL,

    CONSTRAINT "WorkgroupUserTask_pkey" PRIMARY KEY ("workgroupUserId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "workgroupUserId" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "section" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "storyId" TEXT NOT NULL,
    "Sections" JSONB NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkgroupUser_workgroupId_userId_key" ON "WorkgroupUser"("workgroupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkgroupUserTask_workgroupUserId_groupDistributionId_taskH_key" ON "WorkgroupUserTask"("workgroupUserId", "groupDistributionId", "taskHistoryId");

-- AddForeignKey
ALTER TABLE "Workgroup" ADD CONSTRAINT "Workgroup_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkgroupUser" ADD CONSTRAINT "WorkgroupUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkgroupUser" ADD CONSTRAINT "WorkgroupUser_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDistribution" ADD CONSTRAINT "GroupDistribution_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "Workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkgroupUserTask" ADD CONSTRAINT "WorkgroupUserTask_workgroupUserId_fkey" FOREIGN KEY ("workgroupUserId") REFERENCES "WorkgroupUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkgroupUserTask" ADD CONSTRAINT "WorkgroupUserTask_groupDistributionId_fkey" FOREIGN KEY ("groupDistributionId") REFERENCES "GroupDistribution"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkgroupUserTask" ADD CONSTRAINT "WorkgroupUserTask_taskHistoryId_fkey" FOREIGN KEY ("taskHistoryId") REFERENCES "TaskHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workgroupUserId_fkey" FOREIGN KEY ("workgroupUserId") REFERENCES "WorkgroupUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
