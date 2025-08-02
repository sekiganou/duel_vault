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
      matchesA: true,
      matchesB: true,
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

  // // Get presigned URL for avatar if it exists
  // const minio = getMinioClient();
  // const bucketExists = await minio.bucketExists(S3_BUCKET);

  // if (bucketExists && deck.avatar) {
  //   try {
  //     deck.avatar = await minio.presignedGetObject(
  //       S3_BUCKET,
  //       deck.avatar,
  //       60 * 60 * 24
  //     );
  //   } catch (error) {
  //     console.warn(
  //       `Failed to generate presigned URL for avatar ${deck.avatar}:`,
  //       error
  //     );
  //     // Keep original avatar filename if presigned URL generation fails
  //   }
  // }

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
