-- DropForeignKey
ALTER TABLE "GroupItem" DROP CONSTRAINT "GroupItem_layoutId_fkey";

-- AddForeignKey
ALTER TABLE "GroupItem" ADD CONSTRAINT "GroupItem_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
