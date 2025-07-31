import axios from "axios";
import { z } from "zod";
import { UpsertDeckSchema } from "../schemas/decks";
import { Deck } from "@/types";
import { getMinioClient } from "@/s3";
import { addToast } from "@heroui/toast";
import { uploadToMinio } from "./minio";

const basePath = "/api/decks";

export async function getAllDecks(): Promise<Deck[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function createDeck(
  deck: {
    name: string;
    formatId: number;
    archetypeId: number;
    description: string | null;
    active: boolean;
  },
  file: File | null
) {
  try {
    const avatar = file && (await uploadToMinio(file));
    const validateDeck = UpsertDeckSchema.parse({ ...deck, avatar });
    const response = await axios.post(basePath, validateDeck);

    console.log("Deck created:", response.data);
    addToast({
      title: "Deck created successfully!",
      color: "success",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(" Validation Error:", error.message);
    } else {
      console.error(" Axios or Network Error:", error);
    }
    addToast({
      title: "Failed to create deck. Please try again",
      color: "danger",
    });
  }
}

export async function updateDeck(
  id: number,
  data: {
    name: string;
    formatId: number;
    archetypeId: number;
    description: string | null;
  }
) {}

export async function deleteDeck(id: number) {
  await axios.delete(`${basePath}?id=${id}`);
}
