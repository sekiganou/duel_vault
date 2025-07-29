import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const tests = await db.table_name.findMany();
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  await db.table_name.create({
    data: { name },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db.table_name.delete({
    where: { id: id },
  });

  return NextResponse.json({ success: true });
}
