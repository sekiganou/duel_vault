import { NextRequest, NextResponse } from "next/server";

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(handler: Handler): Handler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error("API Error:", error);

      return NextResponse.json(
        {
          error: "Internal Server Error",
          details:
            process.env.NODE_ENV === "development"
              ? error.message || String(error)
              : undefined,
        },
        { status: 500 }
      );
    }
  };
}
