import { db } from "@/db";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { NextResponse } from "next/server";

const schema = db.tournament;

export const GET = withErrorHandler(async () => {
  const items = await schema.findMany({
    orderBy: {
      startDate: "desc",
    },
  });

  return NextResponse.json(items);
});
