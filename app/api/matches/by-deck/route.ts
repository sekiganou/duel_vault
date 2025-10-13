import { client } from "@/client";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { NextRequest, NextResponse } from "next/server";

const schema = client.match;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const defaultDeckId = -1;
  const deckAId = parseInt(
    url.searchParams.get("deckAId") || defaultDeckId.toString()
  );
  const deckBId = parseInt(
    url.searchParams.get("deckBId") || defaultDeckId.toString()
  );

  if (isNaN(deckAId) || deckAId === defaultDeckId || isNaN(deckBId)) {
    return NextResponse.json({ error: "Invalid deck IDs" }, { status: 400 });
  }
  const matches = await schema.findMany({
    where: {
      OR: [
        {
          deckAId: deckAId,
          deckBId: deckBId === defaultDeckId ? undefined : deckBId,
        },
        {
          deckBId: deckAId,
          deckAId: deckBId === defaultDeckId ? undefined : deckBId,
        },
      ],
    },
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

  if (!matches) {
    return NextResponse.json({ error: "Matches not found" }, { status: 404 });
  }

  return NextResponse.json(matches);
});
