// app/api/minio/upload-url/route.ts
import { UploadObjectSchema } from "@/lib/schemas/minio";
import { getMinioClient, S3_BUCKET } from "@/s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { filename, contentType } = UploadObjectSchema.parse(body);

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename or contentType" },
      { status: 400 }
    );
  }

  const minio = getMinioClient();

  const bucketExists = await minio.bucketExists(S3_BUCKET);
  if (!bucketExists) await minio.makeBucket(S3_BUCKET);

  const url = await minio.presignedPutObject(S3_BUCKET, filename, 60 * 60);

  return NextResponse.json({ url });
}
