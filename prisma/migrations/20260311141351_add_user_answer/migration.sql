-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "collecteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswerSlot" (
    "userAnswerId" INTEGER NOT NULL,
    "storeSlotId" INTEGER NOT NULL,

    CONSTRAINT "UserAnswerSlot_pkey" PRIMARY KEY ("userAnswerId","storeSlotId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_userId_collecteId_key" ON "UserAnswer"("userId", "collecteId");

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswerSlot" ADD CONSTRAINT "UserAnswerSlot_userAnswerId_fkey" FOREIGN KEY ("userAnswerId") REFERENCES "UserAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswerSlot" ADD CONSTRAINT "UserAnswerSlot_storeSlotId_fkey" FOREIGN KEY ("storeSlotId") REFERENCES "StoreSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
