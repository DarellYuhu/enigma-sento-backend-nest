/*
  Warnings:

  - A unique constraint covering the columns `[workgroupId,groupDistributionCode,session,projectId,storyId]` on the table `ContentDistribution` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `ContentDistribution` table without a default value. This is not possible if the table is not empty.

*/ -- DropIndex

DROP INDEX "ContentDistribution_workgroupId_groupDistributionCode_sessi_key";

-- AlterTable

ALTER TABLE "ContentDistribution" ADD COLUMN "projectId" TEXT NULL;

-- data backfilling

UPDATE "ContentDistribution" AS ncd
SET "projectId" =
  (SELECT DISTINCT(pj.id)
   FROM "ContentDistribution" AS cd
   LEFT JOIN "GroupDistribution" gd ON cd."groupDistributionCode" = gd.id
   LEFT JOIN "WorkgroupUserTask" as wut ON gd.id = wut."groupDistributionId"
   LEFT JOIN "Project" pj ON pj."workgroupUserId" = wut."workgroupUserId"
   WHERE cd.id = ncd.id
     AND pj.NAME =
       (SELECT split_part(ncd.path, '/', 2)
        FROM "ContentDistribution" icd
        WHERE icd.id = ncd.id ))
WHERE "projectId" IS NULL;

-- Step 3: Make projectId NOT NULL after backfilling

ALTER TABLE "ContentDistribution"
ALTER COLUMN "projectId"
SET NOT NULL;

-- CreateIndex

CREATE UNIQUE INDEX "ContentDistribution_workgroupId_groupDistributionCode_sessi_key" ON "ContentDistribution"("workgroupId",
                                                                                                               "groupDistributionCode",
                                                                                                               "session",
                                                                                                               "projectId",
                                                                                                               "storyId");

-- AddForeignKey

ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON
DELETE RESTRICT ON
UPDATE CASCADE;

