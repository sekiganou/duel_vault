import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { getMinioClient, S3_BUCKET } from "@/s3";
import {
  SetAvatarCacheSchema,
  GetAvatarCacheSchema,
  DeleteAvatarCacheSchema,
  ClearExpiredCacheSchema,
} from "@/lib/schemas/avatarCache";
import z from "zod";

// GET: Get presigned URL for avatar
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const parsed = GetAvatarCacheSchema.safeParse(
    Object.fromEntries(searchParams)
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: z.treeifyError(parsed.error),
      },
      { status: 400 }
    );
  }

  const { filename } = parsed.data;

  try {
    const minio = getMinioClient();
    const bucketExists = await minio.bucketExists(S3_BUCKET);

    if (!bucketExists) {
      return NextResponse.json(
        { error: "Storage bucket not found" },
        { status: 404 }
      );
    }

    // Check if object exists
    try {
      await minio.statObject(S3_BUCKET, filename);
    } catch (error) {
      return NextResponse.json(
        { error: "Avatar file not found" },
        { status: 404 }
      );
    }

    // Generate presigned URL (24 hours)
    const presignedUrl = await minio.presignedGetObject(
      S3_BUCKET,
      filename,
      60 * 60 * 24
    );

    return NextResponse.json({
      filename,
      presignedUrl,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
});

// POST: Bulk get presigned URLs for multiple avatars
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const FilenamesSchema = z.object({
    filenames: z.array(z.string().min(1)).max(50), // Limit to 50 files
  });

  const parsed = FilenamesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { filenames } = parsed.data;

  try {
    const minio = getMinioClient();
    const bucketExists = await minio.bucketExists(S3_BUCKET);

    if (!bucketExists) {
      return NextResponse.json(
        { error: "Storage bucket not found" },
        { status: 404 }
      );
    }

    const results: Record<
      string,
      { presignedUrl: string; expiresAt: number } | { error: string }
    > = {};

    await Promise.all(
      filenames.map(async (filename) => {
        try {
          // Check if object exists
          await minio.statObject(S3_BUCKET, filename);

          // Generate presigned URL (24 hours)
          const presignedUrl = await minio.presignedGetObject(
            S3_BUCKET,
            filename,
            60 * 60 * 24
          );

          results[filename] = {
            presignedUrl,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
        } catch (error) {
          results[filename] = {
            error: "File not found or access denied",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in bulk presigned URL generation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
});

// PUT: Force refresh presigned URL for avatar (invalidate cache)
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = GetAvatarCacheSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { filename } = parsed.data;

  try {
    const minio = getMinioClient();
    const bucketExists = await minio.bucketExists(S3_BUCKET);

    if (!bucketExists) {
      return NextResponse.json(
        { error: "Storage bucket not found" },
        { status: 404 }
      );
    }

    // Check if object exists
    try {
      await minio.statObject(S3_BUCKET, filename);
    } catch (error) {
      return NextResponse.json(
        { error: "Avatar file not found" },
        { status: 404 }
      );
    }

    // Generate new presigned URL (24 hours)
    const presignedUrl = await minio.presignedGetObject(
      S3_BUCKET,
      filename,
      60 * 60 * 24
    );

    return NextResponse.json({
      filename,
      presignedUrl,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      refreshed: true,
    });
  } catch (error) {
    console.error("Error refreshing presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to refresh presigned URL" },
      { status: 500 }
    );
  }
});
