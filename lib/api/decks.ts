import axios from "axios";
import { size, z } from "zod";
import {
  DeleteDecksSchema as DeleteDecksSchema,
  UpsertDeckSchema,
} from "../schemas/decks";
import { DeckWithRelations } from "@/types";
import { getMinioClient, IMAGE_BUCKET } from "@/s3";
import { addToast } from "@heroui/toast";
import { deleteFile, uploadFile } from "./minio";
import { ChipProps } from "@heroui/chip";
import { Button } from "@heroui/button";
import { getAvatarUrl } from "./avatarCache";

const basePath = "/api/decks";

export const statusColorMap: Record<string, ChipProps["color"]> = {
  active: "success",
  inactive: "default",
};

export function getDeckStatus(deck: DeckWithRelations): string {
  return deck.active ? "active" : "inactive";
}

export async function getAllDecks(): Promise<DeckWithRelations[]> {
  const res = await axios.get(basePath);
  const decks: DeckWithRelations[] = res.data;

  // Replace avatar paths with cached presigned URLs
  await Promise.all(
    decks.map(async (deck) => {
      if (deck.avatar) {
        const presignedUrl = await getAvatarUrl(deck.avatar);
        if (presignedUrl) {
          deck.avatar = presignedUrl;
        }
      }
    })
  );

  return decks;
}

export async function getDeckById(id: number): Promise<DeckWithRelations> {
  const res = await axios.get(`${basePath}/${id}`);
  const deck: DeckWithRelations = res.data;

  // Replace avatar path with cached presigned URL
  if (deck.avatar) {
    const presignedUrl = await getAvatarUrl(deck.avatar);
    if (presignedUrl) {
      deck.avatar = presignedUrl;
    }
  }

  deck.matchesA.forEach(async (match) => {
    if (deck.id !== match.deckAId && match.deckA.avatar)
      match.deckA.avatar = await getAvatarUrl(match.deckA.avatar);
    if (deck.id !== match.deckBId && match.deckB.avatar)
      match.deckB.avatar = await getAvatarUrl(match.deckB.avatar);
  });

  deck.matchesB.forEach(async (match) => {
    if (deck.id !== match.deckAId && match.deckA.avatar)
      match.deckA.avatar = await getAvatarUrl(match.deckA.avatar);
    if (deck.id !== match.deckBId && match.deckB.avatar)
      match.deckB.avatar = await getAvatarUrl(match.deckB.avatar);
  });

  return deck;
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
    await axios.delete(`${basePath}/${id}`).then(() => {
      if (avatar) deleteFile(avatar);
    });

    addToast({
      title: `Deck deleted successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting deck:", error);
    addToast({
      title: `Failed to delete deck. Please try again`,
      description: "This deck may be associated with matches or tournaments.",
      color: "danger",
    });
    return;
  }
}

export async function deleteDecks(ids: number[]) {
  try {
    const parsedIds = DeleteDecksSchema.parse(ids);
    await axios.delete(`${basePath}`, { data: parsedIds });

    addToast({
      title: `Decks deleted successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting decks:", error);
    addToast({
      title: `Failed to delete decks. Please try again`,
      description: "These decks may be associated with matches or tournaments.",
      color: "danger",
    });
    return;
  }
}
