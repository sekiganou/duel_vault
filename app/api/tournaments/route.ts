import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import {
  DeleteTournamentsSchema,
  UpsertTournamentSchema,
} from "@/lib/schemas/tournaments";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { JsonDatabase } from "brackets-json-db";
import { BracketsManager } from "brackets-manager";
import fs from "fs";
import { BRACKET_BUCKET } from "@/s3/buckets";
import { getMinioClient } from "@/s3";
import { TournamentStatus } from "@/generated/prisma";

export const GET = withErrorHandler(async () => {
  const items = await client.tournament.findMany({
    include: {
      format: true,
      matches: {
        include: {
          deckA: {
            include: {
              archetype: true,
              format: true,
            },
          },
          deckB: {
            include: {
              archetype: true,
              format: true,
            },
          },
          winner: {
            include: {
              archetype: true,
              format: true,
            },
          },
        },
      },
      deckStats: {
        include: {
          deck: {
            include: {
              archetype: true,
              format: true,
            },
          },
        },
      },
      stages: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return NextResponse.json(items);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = UpsertTournamentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { id, startDate, endDate, participants, bracket, ...dataWithoutId } =
    parsed.data;
  const tournamentData = {
    ...dataWithoutId,
    status:
      new Date(startDate) > new Date()
        ? TournamentStatus.UPCOMING
        : TournamentStatus.ONGOING,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
  };

  const getFileName = (tournamentId: number, stageOrder: number) =>
    `tournament-${tournamentId}-stage-${stageOrder}.json`;

  const ID = await client.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: tournamentData,
      select: {
        id: true,
      },
    });

    await tx.tournamentDeckStats.createMany({
      data: participants.map((participant) => ({
        tournamentId: tournament.id,
        deckId: participant.id,
        wins: 0,
        losses: 0,
        ties: 0,
      })),
    });

    const filename = getFileName(tournament.id, 1);
    const filepath = `./${filename}`;

    const storage = new JsonDatabase(filename);
    const manager = new BracketsManager(storage);

    const name = "Stage 1";

    await manager.create.stage({
      name: name,
      tournamentId: tournament.id, //
      type: bracket.type,
      seeding: participants.map((participant) => participant.name),

      settings: {
        grandFinal: bracket.settings.grandFinal,
        groupCount: bracket.settings.groupCount,
        roundRobinMode: bracket.settings.roundRobinMode,
      },
    });

    const minio = getMinioClient();

    const bucketExists = await minio.bucketExists(BRACKET_BUCKET);
    if (!bucketExists) await minio.makeBucket(BRACKET_BUCKET);

    // Direct upload method (alternative to pre-signed URL)
    const fileContent = fs.readFileSync(filepath);
    await minio.putObject(
      BRACKET_BUCKET,
      filename,
      fileContent,
      fileContent.length,
      {
        "Content-Type": "application/json",
      }
    );

    await tx.tournamentStages.create({
      data: {
        tournamentId: tournament.id,
        name: name,
        order: 1,
        fileKey: filename,
      },
    });

    return tournament.id;
  });

  await new Promise<void>((resolve, reject) => {
    fs.unlink(getFileName(ID, 1), (err) => {
      if (err) reject(err);
      else {
        console.log("File removed!");
        resolve();
      }
    });
  });

  return NextResponse.json({ success: true, createdId: ID });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = DeleteTournamentsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ID(s)", details: parsed.error },
      { status: 400 }
    );
  }

  const ids = parsed.data;

  await client.$transaction(async (tx) => {
    const minio = getMinioClient();

    await tx.tournamentStages
      .findMany({
        where: { tournamentId: { in: ids } },
      })
      .then(async (stages) => {
        for (const stage of stages) {
          try {
            await minio.removeObject(BRACKET_BUCKET, stage.fileKey);
          } catch (error) {
            console.error(
              `Error deleting bracket file ${stage.fileKey}:`,
              error
            );
          }
        }
      });

    await tx.tournament.deleteMany({
      where: { id: { in: ids } },
    });
  });

  return NextResponse.json({ success: true, IDS: ids });
});
