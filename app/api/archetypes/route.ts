import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { UpsertArchetypeSchema } from "@/lib/schemas/archetypes";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = db.archetype;

export const GET = withErrorHandler(async () => {
  const items = await schema.findMany({});
  return NextResponse.json(items);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = UpsertArchetypeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const newItem = await schema.create({
    data: parsed.data,
  });

  return NextResponse.json({ success: true, item: newItem });
});
