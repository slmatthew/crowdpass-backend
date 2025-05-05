/*
  Warnings:

  - A unique constraint covering the columns `[name,isDeleted]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,categoryId,isDeleted]` on the table `subcategories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subcategories" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_isDeleted_key" ON "categories"("name", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_name_categoryId_isDeleted_key" ON "subcategories"("name", "categoryId", "isDeleted");
