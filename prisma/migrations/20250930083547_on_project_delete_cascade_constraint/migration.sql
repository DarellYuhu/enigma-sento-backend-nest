-- DropForeignKey
ALTER TABLE "ContentDistribution" DROP CONSTRAINT "ContentDistribution_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
