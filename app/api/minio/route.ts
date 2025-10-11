import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { DeleteObjectSchema, UploadObjectSchema } from "@/lib/schemas/minio";
import { getMinioClient } from "@/s3";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { bucket, filename, contentType } = UploadObjectSchema.parse(body);

  if (!filename || !contentType || !bucket) {
    return NextResponse.json(
      { error: "Missing filename or contentType or bucket" },
      { status: 400 }
    );
  }

  const minio = getMinioClient();

  const bucketExists = await minio.bucketExists(bucket);
  if (!bucketExists) await minio.makeBucket(bucket);

  const url = await minio.presignedPutObject(bucket, filename, 24 * 60 * 60);

  return NextResponse.json({ url });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const parsedSearchParams = DeleteObjectSchema.safeParse(
    Object.fromEntries(searchParams)
  ).data;

  if (!parsedSearchParams) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const filename = parsedSearchParams.filename;

  if (!filename) {
    return NextResponse.json(
      { error: "Missing filename parameter" },
      { status: 400 }
    );
  }

  const minio = getMinioClient();
  try {
    await minio.removeObject(parsedSearchParams.bucket, filename);
    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
});
