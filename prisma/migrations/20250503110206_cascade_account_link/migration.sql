-- DropForeignKey
ALTER TABLE "AccountLinkRequest" DROP CONSTRAINT "AccountLinkRequest_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "AccountLinkRequest" DROP CONSTRAINT "AccountLinkRequest_targetId_fkey";

-- AddForeignKey
ALTER TABLE "AccountLinkRequest" ADD CONSTRAINT "AccountLinkRequest_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLinkRequest" ADD CONSTRAINT "AccountLinkRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
