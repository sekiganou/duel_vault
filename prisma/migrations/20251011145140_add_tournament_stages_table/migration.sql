-- CreateTable
CREATE TABLE "public"."tournament_stages" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tournament_stages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tournament_stages" ADD CONSTRAINT "tournament_stages_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
