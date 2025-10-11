import { withErrorHandler } from "@/lib/middlewares/withErrorHandler";
import { DeleteObjectSchema, UploadObjectSchema } from "@/lib/schemas/minio";
import { getMinioClient, IMAGE_BUCKET } from "@/s3";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { filename, contentType } = UploadObjectSchema.parse(body);

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename or contentType" },
      { status: 400 }
    );
  }

  const minio = getMinioClient();

  const bucketExists = await minio.bucketExists(IMAGE_BUCKET);
  if (!bucketExists) await minio.makeBucket(IMAGE_BUCKET);

  const url = await minio.presignedPutObject(
    IMAGE_BUCKET,
    filename,
    24 * 60 * 60
  );

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
    await minio.removeObject(IMAGE_BUCKET, filename);
    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
});
