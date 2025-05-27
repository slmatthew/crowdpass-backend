/*
  Warnings:

  - You are about to drop the column `qrCodeUrl` on the `tickets` table. All the data in the column will be lost.
  - Made the column `qrCodeSecret` on table `tickets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "qrCodeUrl",
ALTER COLUMN "qrCodeSecret" SET NOT NULL;
