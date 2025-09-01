import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { CreateChallongeTournamentSchema } from "@/lib/schemas/challonge";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const { data } = await axios.get(
    `${process.env.CHALLONGE_API_URL}/tournaments.json?api_key=${process.env.CHALLONGE_API_KEY}`
  );
  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateChallongeTournamentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tournament data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, tournament_type, description, ranked_by } = parsed.data;

  const { data } = await axios.post(
    `${process.env.CHALLONGE_API_URL}/tournaments.json?api_key=${process.env.CHALLONGE_API_KEY}`,
    {
      tournament: {
        name,
        tournament_type,
        description,
        ranked_by,
      },
    }
  );

  return NextResponse.json({
    success: true,
    challongeTournament: data.tournament,
  });
});
