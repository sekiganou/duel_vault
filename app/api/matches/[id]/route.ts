import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { NextRequest, NextResponse } from "next/server";

const schema = db.match;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = parseInt(pathSegments[pathSegments.length - 1]);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
  }
  const match = await schema.findUnique({
    where: { id },
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
      winner: true,
      tournament: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
});
