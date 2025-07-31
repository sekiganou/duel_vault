import * as Minio from "minio";

export const S3_BUCKET = "duel-vault";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST!,
  port: 9000,
  useSSL: process.env.NODE_ENV !== "development",
  accessKey: process.env.MINIO_ROOT_USER!,
  secretKey: process.env.MINIO_ROOT_PASSWORD!,
});
