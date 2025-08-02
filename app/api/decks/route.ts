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

  const minio = getMinioClient();

  const bucketExists = await minio.bucketExists(S3_BUCKET);
  if (bucketExists)
    await Promise.all(
      items.map(async (item) => {
        if (item.avatar) {
          item.avatar = await minio.presignedGetObject(
            S3_BUCKET,
            item.avatar,
            60 * 60 * 24
          );
        }
      })
    );

  return NextResponse.json(items);
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

