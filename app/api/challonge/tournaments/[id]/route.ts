import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  if (!id) {
    return NextResponse.json(
      { error: "Tournament ID is required" },
      { status: 400 }
    );
  }

  const response = await axios.get(
    `${process.env.CHALLONGE_API_URL}/tournaments/${id}.json?api_key=${process.env.CHALLONGE_API_KEY}`
  );

  return NextResponse.json(response.data);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  if (!id) {
    return NextResponse.json(
      { error: "Tournament ID is required" },
      { status: 400 }
    );
  }

  await axios.delete(
    `${process.env.CHALLONGE_API_URL}/tournaments/${id}.json?api_key=${process.env.CHALLONGE_API_KEY}`
  );

  return NextResponse.json({ success: true });
});
