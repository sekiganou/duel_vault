import { Format } from "@/generated/prisma";
import axios from "axios";

const basePath = "/api/formats";

export async function getAllFormats(): Promise<Format[]> {
  const res = await axios.get(basePath);
  return res.data;
}
