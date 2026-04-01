-- DropForeignKey
ALTER TABLE "UserAnswer" DROP CONSTRAINT "UserAnswer_collecteId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- CreateTable
CREATE TABLE "CollectionUser" (
    "collectionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CollectionUser_pkey" PRIMARY KEY ("collectionId","userId")
);

-- CreateIndex
CREATE INDEX "UserAnswer_collecteId_idx" ON "UserAnswer"("collecteId");

-- AddForeignKey
ALTER TABLE "CollectionUser" ADD CONSTRAINT "CollectionUser_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionUser" ADD CONSTRAINT "CollectionUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_collecteId_userId_fkey" FOREIGN KEY ("collecteId", "userId") REFERENCES "CollectionUser"("collectionId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
