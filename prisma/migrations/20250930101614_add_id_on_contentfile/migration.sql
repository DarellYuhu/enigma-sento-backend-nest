-- AlterTable
ALTER TABLE "ContentFile" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ContentFile_pkey" PRIMARY KEY ("id");
