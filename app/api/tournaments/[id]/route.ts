import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertTournamentSchema } from "@/lib/schemas/tournaments";
import { getMinioClient } from "@/s3";
import { BRACKET_BUCKET } from "@/s3/buckets";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  const tournament = await client.tournament.findUnique({
    where: {
      id: id,
    },
    include: {
      stages: true,
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
        orderBy: {
          date: "desc",
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
    },
  });

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  for (const stage of tournament.stages) {
    if (stage.fileKey) {
      const minio = getMinioClient();
      try {
        stage.fileKey = await minio.presignedGetObject(
          BRACKET_BUCKET,
          stage.fileKey,
          24 * 60 * 60 // 24 hours
        );
      } catch (error) {
        console.error(
          `Error generating presigned URL for ${stage.fileKey}:`,
          error
        );
      }
    }
  }

  return NextResponse.json(tournament);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  const body = await req.json();
  const parsed = UpsertTournamentSchema.omit({
    id: true,
    formatId: true,
    bracket: true,
    participants: true,
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tournament data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const updatedTournament = await client.tournament.update({
    where: { id: id },
    data: parsed.data,
  });

  return NextResponse.json(updatedTournament);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 }
    );
  }

  await client.$transaction(async (tx) => {
    const minio = getMinioClient();

    await tx.tournamentStages
      .findMany({
        where: { tournamentId: id },
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

    await tx.tournament.delete({
      where: { id: id },
    });
  });

  return NextResponse.json({ success: true, deletedId: id });
});
