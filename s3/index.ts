import * as Minio from "minio";

export const S3_BUCKET = "duel-vault";

let cachedMinioclient: Minio.Client | null = null;

export const getMinioClient = () => {
  if (!process.env.MINIO_HOST) {
    throw new Error("Missing MINIO_HOST environment variable");
  }
  const isProduction = process.env.NODE_ENV === "production";
  return (
    cachedMinioclient ||
    new Minio.Client({
      endPoint: process.env.MINIO_HOST,
      port: isProduction ? 443 : 9000,
      useSSL: isProduction,
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    })
  );
};
