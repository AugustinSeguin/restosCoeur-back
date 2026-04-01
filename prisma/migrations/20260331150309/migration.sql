-- CreateTable
CREATE TABLE "UserAnswerZone" (
    "userAnswerId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "UserAnswerZone_pkey" PRIMARY KEY ("userAnswerId","zoneId")
);

-- AddForeignKey
ALTER TABLE "UserAnswerZone" ADD CONSTRAINT "UserAnswerZone_userAnswerId_fkey" FOREIGN KEY ("userAnswerId") REFERENCES "UserAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswerZone" ADD CONSTRAINT "UserAnswerZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
