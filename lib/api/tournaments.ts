import axios from "axios";
import { Tournament } from "@/generated/prisma";

const basePath = "/api/tournaments";

export async function getAllTournaments(): Promise<Tournament[]> {
  const res = await axios.get(basePath);
  return res.data;
}
