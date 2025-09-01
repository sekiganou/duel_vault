import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import axios from "axios";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const { data } = await axios.get(
    `${process.env.CHALLONGE_API_URL}/tournaments.json?api_key=${process.env.CHALLONGE_API_KEY}`
  );
  return NextResponse.json(data);
});
