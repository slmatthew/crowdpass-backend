/*
  Warnings:

  - A unique constraint covering the columns `[qrCodeSecret]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrCodeSecret_key" ON "tickets"("qrCodeSecret");
