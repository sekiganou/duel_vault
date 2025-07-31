import { Archetype } from "@/generated/prisma";
import axios from "axios";

const basePath = "/api/archetypes";

export async function getAllArchetypes(): Promise<Archetype[]> {
  const res = await axios.get(basePath);
  return res.data;
}
