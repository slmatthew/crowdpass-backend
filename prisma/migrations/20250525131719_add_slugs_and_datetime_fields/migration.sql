/*
  Warnings:

  - You are about to drop the column `qrCodeUrl` on the `tickets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `organizers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId,name]` on the table `ticket_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `account_link_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ticket_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_link_requests" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSalesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" VARCHAR(255),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "organizers" ADD COLUMN     "slug" VARCHAR(255);

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "userIp" TEXT;

-- AlterTable
ALTER TABLE "ticket_types" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSalesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" VARCHAR(255),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "qrCodeUrl",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_partial_idx" ON "events"("slug") WHERE "slug" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "organizers_name_key" ON "organizers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_slug_partial_idx" ON "organizers"("slug") WHERE "slug" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_slug_partial_idx" ON "ticket_types"("slug") WHERE "slug" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_eventId_name_key" ON "ticket_types"("eventId", "name");
