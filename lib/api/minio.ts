import axios from "axios";
import { DeleteObjectSchema, UploadObjectSchema } from "../schemas/minio";
import { getMinioClient, S3_BUCKET } from "@/s3";

// Client-safe UUID generator
function randomUUID(): string {
  // https://stackoverflow.com/a/2117523/2715716
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

const basePath = "/api/minio";

export async function uploadFile(file: File): Promise<string> {
  const uuid = randomUUID();
  const { type: contentType } = file;
  const filename = `${uuid}-${file.name}`;
  const validateFile = UploadObjectSchema.parse({ filename, contentType });
  const response = await axios.post(`${basePath}`, {
    filename: validateFile.filename,
    contentType: validateFile.contentType,
  });
  const { url: uploadUrl } = response.data;

  await axios.put(uploadUrl, file);
  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  const validateRequest = DeleteObjectSchema.parse({ filename });
  await axios.delete(`${basePath}?filename=${validateRequest.filename}`);
}
