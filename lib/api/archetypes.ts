import { Archetype } from "@/generated/prisma";
import axios from "axios";
import { UpsertArchetypeSchema } from "../schemas/archetypes";
import { addToast } from "@heroui/toast";
import z from "zod";

const basePath = "/api/archetypes";

export async function getAllArchetypes(): Promise<Archetype[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function createArchetype(archetype: { name: string }) {
  try {
    const validateArchetype = UpsertArchetypeSchema.parse(archetype);
    const response = await axios.post(basePath, validateArchetype);
    addToast({
      title: "Archetype created successfully!",
      color: "success",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(" Validation Error:", error.message);
    } else {
      console.error(" Axios or Network Error:", error);
    }
    addToast({
      title: "Failed to create archetype. Please try again",
      color: "danger",
    });
  }
}
