-- CreateTable
CREATE TABLE "GroupItem" (
    "layoutId" INTEGER NOT NULL,
    "layoutGroupId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "LayoutGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LayoutGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupItem_layoutId_layoutGroupId_key" ON "GroupItem"("layoutId", "layoutGroupId");

-- AddForeignKey
ALTER TABLE "GroupItem" ADD CONSTRAINT "GroupItem_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupItem" ADD CONSTRAINT "GroupItem_layoutGroupId_fkey" FOREIGN KEY ("layoutGroupId") REFERENCES "LayoutGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
