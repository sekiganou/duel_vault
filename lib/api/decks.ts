import axios from "axios";
import { z } from "zod";
import { CreateDeckSchema } from "../schemas/decks";
import { Deck } from "@/types";

const basePath = "/api/decks";

export async function getAllDecks(): Promise<Deck[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function createDeck(data: {
  name: string;
  formatId: number;
  archetypeId: number;
  description: string | null;
}) {
  try {
    const validateDeck = CreateDeckSchema.parse(data);
    const response = await axios.post(basePath, validateDeck);
    console.log("Deck created:", response.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(" Validation Error:", error.message);
    } else {
      console.error(" Axios or Network Error:", error);
    }
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
