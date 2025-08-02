import axios from "axios";
import { z } from "zod";
import { UpsertDeckSchema } from "../schemas/decks";
import { Deck } from "@/types";
import { getMinioClient } from "@/s3";
import { addToast } from "@heroui/toast";
import { deleteFile, uploadFile } from "./minio";

const basePath = "/api/decks";

export function getDeckStatus (deck: Deck): string {
  return deck.active ? "active" : "inactive";
}

export async function getAllDecks(): Promise<Deck[]> {
  const res = await axios.get(basePath);
  return res.data;
}

export async function getDeckById(id: number): Promise<Deck> {
  const res = await axios.get(`${basePath}/${id}`);
  return res.data;
}

export async function upsertDeck(
  deck: {
    id: number | null;
    name: string;
    formatId: number;
    archetypeId: number;
    description: string | null;
    active: boolean;
  },
  avatarFile: File | null,
  currentAvatar: string | null,
  nextAvatar: string | null
) {
  try {
    const isAvatarToDelete =
      currentAvatar !== null && avatarFile === null && nextAvatar === null;

    if (isAvatarToDelete) await deleteFile(currentAvatar);

    const avatarName = avatarFile
      ? await uploadFile(avatarFile)
      : isAvatarToDelete
        ? null
        : nextAvatar;
    const validateDeck = UpsertDeckSchema.parse({
      ...deck,
      avatar: avatarName,
    });

    await axios.post(basePath, validateDeck);

    addToast({
      title: `Deck updated successfully!`,
      color: "success",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(" Validation Error:", error.message);
    } else {
      console.error(" Axios or Network Error:", error);
    }
    addToast({
      title: `Failed to update deck. Please try again`,
      color: "danger",
    });
  }
}

export async function deleteDeck(id: number, avatar: string | null) {
  try {
    if (avatar) await deleteFile(avatar);

    await axios.delete(`${basePath}?id=${id}`);

    addToast({
      title: `Deck deleted successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting deck:", error);
    addToast({
      title: `Failed to delete deck. Please try again`,
      color: "danger",
    });
    return;
  }
}
