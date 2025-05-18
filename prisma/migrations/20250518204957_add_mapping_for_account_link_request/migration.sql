/*
  Warnings:

  - You are about to drop the `AccountLinkRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountLinkRequest" DROP CONSTRAINT "AccountLinkRequest_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "AccountLinkRequest" DROP CONSTRAINT "AccountLinkRequest_targetId_fkey";

-- DropTable
DROP TABLE "AccountLinkRequest";

-- CreateTable
CREATE TABLE "account_link_requests" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "platform" "Platform" NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_link_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_link_requests_code_key" ON "account_link_requests"("code");

-- AddForeignKey
ALTER TABLE "account_link_requests" ADD CONSTRAINT "account_link_requests_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_link_requests" ADD CONSTRAINT "account_link_requests_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
