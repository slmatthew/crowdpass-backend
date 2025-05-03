-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TELEGRAM', 'VK');

-- CreateTable
CREATE TABLE "AccountLinkRequest" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "platform" "Platform" NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountLinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountLinkRequest_code_key" ON "AccountLinkRequest"("code");

-- AddForeignKey
ALTER TABLE "AccountLinkRequest" ADD CONSTRAINT "AccountLinkRequest_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLinkRequest" ADD CONSTRAINT "AccountLinkRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
