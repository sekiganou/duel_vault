import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { getMinioClient, S3_BUCKET } from "@/s3";
import { NextRequest, NextResponse } from "next/server";

const schema = db.deck;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
  }

  const deck = await schema.findUnique({
    where: { id },
    include: {
      archetype: true,
      format: true,
      matchesA: {
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
          tournament: true,
        },
      },
      matchesB: {
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
          tournament: true,
        },
      },
      winsAs: true,
      tournamentStats: {
        include: {
          tournament: true,
        },
      },
    },
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Note: Avatar URL should be managed through the avatar-cache API
  // This endpoint now returns the avatar path, and the client should
  // use the avatar cache to get presigned URLs
  return NextResponse.json(deck);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await schema.delete({
    where: { id: id },
  });

  return NextResponse.json({ success: true, deletedId: id });
});
