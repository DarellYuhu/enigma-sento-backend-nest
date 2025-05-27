/*
  Warnings:

  - You are about to drop the column `layout` on the `Layout` table. All the data in the column will be lost.
  - Added the required column `template` to the `Layout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Layout" DROP COLUMN "layout",
ADD COLUMN     "template" JSONB NOT NULL;
