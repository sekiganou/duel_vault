import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertDeckSchema } from "@/lib/schemas/decks";
import { getMinioClient, S3_BUCKET } from "@/s3";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = db.deck;

export const GET = withErrorHandler(async () => {
  const items = await schema.findMany({
    include: {
      archetype: true,
      format: true,
    },
  });

  // Extract avatar filenames for bulk processing
  const avatarFilenames = items
    .map((item) => item.avatar)
    .filter((avatar): avatar is string => Boolean(avatar));

  // Generate presigned URLs for all avatars at once
  const presignedUrls = new Map<string, string>();

  if (avatarFilenames.length > 0) {
    const minio = getMinioClient();
    const bucketExists = await minio.bucketExists(S3_BUCKET);

    if (bucketExists) {
      await Promise.all(
        avatarFilenames.map(async (filename) => {
          try {
            const presignedUrl = await minio.presignedGetObject(
              S3_BUCKET,
              filename,
              60 * 60 * 24
            );
            presignedUrls.set(filename, presignedUrl);
          } catch (error) {
            console.warn(
              `Failed to generate presigned URL for ${filename}:`,
              error
            );
          }
        })
      );
    }
  }

  // Map presigned URLs to items
  const processedItems = items.map((item) => ({
    ...item,
    avatar:
      item.avatar && presignedUrls.has(item.avatar)
        ? presignedUrls.get(item.avatar)!
        : item.avatar,
  }));

  return NextResponse.json(processedItems);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = UpsertDeckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { id, ...dataWithoutId } = parsed.data;
  const item = await schema.upsert({
    where: { id: id ?? -1 },
    create: dataWithoutId,
    update: dataWithoutId,
  });

  return NextResponse.json({ success: true, item: item });
});
