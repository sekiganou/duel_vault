import axios from "axios";
import { UploadObjectSchema } from "../schemas/minio";

const basePath = "/api/minio";

export async function uploadToMinio(file: File): Promise<string> {
  const { name: filename, type: contentType } = file;
  const validateFile = UploadObjectSchema.parse({ filename, contentType });
  const response = await axios.post(`${basePath}/upload-url`, {
    filename: validateFile.filename,
    contentType: validateFile.contentType,
  });
  const { url: uploadUrl } = response.data;

  await axios.put(uploadUrl, file);
  return filename;
}
