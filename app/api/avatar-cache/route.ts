import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { db } from "@/db";
import { getMinioClient, S3_BUCKET } from "@/s3";

export const GET = withErrorHandler(async () => {
  // Get all decks with avatars
  const decks = await db.deck.findMany({
    where: {
      avatar: {
        not: null,
      },
    },
    select: {
      avatar: true,
    },
  });

  const minio = getMinioClient();
  const bucketExists = await minio.bucketExists(S3_BUCKET);
  const avatarUrlMap: Record<string, string> = {};

  if (bucketExists) {
    await Promise.all(
      decks.map(async (deck) => {
        if (deck.avatar) {
          const presignedUrl = await minio.presignedGetObject(
            S3_BUCKET,
            deck.avatar,
            60 * 60 * 24 // 24 hours
          );
          avatarUrlMap[deck.avatar] = presignedUrl;
        }
      })
    );
  }

  return NextResponse.json(avatarUrlMap);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { avatarPath } = body;

  if (!avatarPath) {
    return NextResponse.json(
      { error: "Avatar path is required" },
      { status: 400 }
    );
  }

  const minio = getMinioClient();
  const bucketExists = await minio.bucketExists(S3_BUCKET);

  if (!bucketExists) {
    return NextResponse.json({ error: "S3 bucket not found" }, { status: 404 });
  }

  try {
    const presignedUrl = await minio.presignedGetObject(
      S3_BUCKET,
      avatarPath,
      60 * 60 * 24 // 24 hours
    );

    return NextResponse.json({ avatarPath, presignedUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
});
