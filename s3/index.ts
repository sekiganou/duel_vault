import * as Minio from "minio";

export const S3_BUCKET = "duel-vault";

let cachedMinioclient: Minio.Client | null = null;

export const getMinioClient = () => {
  if (!process.env.MINIO_HOST) {
    throw new Error("Missing MINIO_HOST environment variable");
  }

  return (
    cachedMinioclient ||
    new Minio.Client({
      endPoint: process.env.MINIO_HOST,
      port: 9000,
      useSSL: process.env.NODE_ENV === "production",
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    })
  );
};
