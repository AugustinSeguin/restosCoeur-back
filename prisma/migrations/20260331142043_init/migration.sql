/*
  Warnings:

  - The primary key for the `Assignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `storeSlotId` on the `Assignment` table. All the data in the column will be lost.
  - The primary key for the `UserAnswerSlot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `storeSlotId` on the `UserAnswerSlot` table. All the data in the column will be lost.
  - You are about to drop the `StoreSlot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `slotId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slotId` to the `UserAnswerSlot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_storeSlotId_fkey";

-- DropForeignKey
ALTER TABLE "StoreSlot" DROP CONSTRAINT "StoreSlot_storeId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswerSlot" DROP CONSTRAINT "UserAnswerSlot_storeSlotId_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_pkey",
DROP COLUMN "storeSlotId",
ADD COLUMN     "slotId" INTEGER NOT NULL,
ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY ("userId", "slotId");

-- AlterTable
ALTER TABLE "UserAnswerSlot" DROP CONSTRAINT "UserAnswerSlot_pkey",
DROP COLUMN "storeSlotId",
ADD COLUMN     "slotId" INTEGER NOT NULL,
ADD CONSTRAINT "UserAnswerSlot_pkey" PRIMARY KEY ("userAnswerId", "slotId");

-- DropTable
DROP TABLE "StoreSlot";

-- CreateTable
CREATE TABLE "Slot" (
    "id" SERIAL NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "collectionId" INTEGER NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswerSlot" ADD CONSTRAINT "UserAnswerSlot_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
