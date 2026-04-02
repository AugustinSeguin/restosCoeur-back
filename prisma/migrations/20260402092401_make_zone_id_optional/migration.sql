/*
  Warnings:

  - The primary key for the `Assignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `UserAnswerSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAnswerZone` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collectionId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswerSlot" DROP CONSTRAINT "UserAnswerSlot_slotId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswerSlot" DROP CONSTRAINT "UserAnswerSlot_userAnswerId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswerZone" DROP CONSTRAINT "UserAnswerZone_userAnswerId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswerZone" DROP CONSTRAINT "UserAnswerZone_zoneId_fkey";

-- DropIndex
DROP INDEX "UserAnswer_userId_collecteId_key";

-- AlterTable
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_pkey",
ADD COLUMN     "collectionId" INTEGER NOT NULL,
ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY ("userId", "slotId", "storeId", "collectionId");

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "zoneId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserAnswer" ADD COLUMN     "slotId" INTEGER,
ADD COLUMN     "zoneId" INTEGER;

-- DropTable
DROP TABLE "UserAnswerSlot";

-- DropTable
DROP TABLE "UserAnswerZone";

-- CreateIndex
CREATE INDEX "Assignment_collectionId_idx" ON "Assignment"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "UserAnswer_userId_collecteId_idx" ON "UserAnswer"("userId", "collecteId");

-- CreateIndex
CREATE INDEX "UserAnswer_slotId_idx" ON "UserAnswer"("slotId");

-- CreateIndex
CREATE INDEX "UserAnswer_zoneId_idx" ON "UserAnswer"("zoneId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
