/*
  Warnings:

  - The primary key for the `Assignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `storeId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `closingTime` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openingTime` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthdate` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codePostal` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_pkey",
ADD COLUMN     "storeId" INTEGER NOT NULL,
ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY ("userId", "slotId", "storeId");

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "closingTime" TEXT NOT NULL,
ADD COLUMN     "isOpenSunday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openingTime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthdate" DATE NOT NULL,
ADD COLUMN     "codePostal" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
