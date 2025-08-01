import * as Minio from "minio";

export const S3_BUCKET = "duel-vault-2";

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
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    })
  );
};
