import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { DeleteDecksSchema, UpsertDeckSchema } from "@/lib/schemas/decks";
import { getMinioClient } from "@/s3";
import { IMAGE_BUCKET } from "@/s3/buckets";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = client.deck;

export const GET = withErrorHandler(async () => {
  const items = await schema.findMany({
    include: {
      archetype: true,
      format: true,
    },
    orderBy: { name: "asc" },
  });

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

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = DeleteDecksSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ID(s)", details: parsed.error },
      { status: 400 }
    );
  }

  const ids = parsed.data;
  const avatars = await schema.findMany({
    where: {
      id: { in: ids },
    },
    select: { avatar: true },
  });

  const minio = getMinioClient();

  await Promise.all(
    avatars.map((a) =>
      a.avatar ? minio.removeObject(IMAGE_BUCKET, a.avatar) : Promise.resolve()
    )
  );

  await schema.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  return NextResponse.json({ success: true, IDS: ids });
});
