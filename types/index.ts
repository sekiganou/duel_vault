import {
  Archetype,
  Deck,
  Format,
  Match,
  Tournament,
  TournamentDeckStats,
} from "@/generated/prisma";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type DeckWithRelations = Deck & {
  archetype: Archetype;
  format: Format;
};

export type MatchWithRelations = Match & {
  tournament: Tournament | null;
  deckA: Deck & {
    archetype: Archetype;
    format: Format;
  };
  deckB: Deck & {
    archetype: Archetype;
    format: Format;
  };
  winner:
    | (Deck & {
        archetype: Archetype;
        format: Format;
      })
    | null;
};

export const FormatDescriptions = {
  SpeedDuel: "Speed Duel",
  Standard: "Standard",
  RushDuel: "Rush Duel",
} as const;

export type TableColumnDescriptor = {
  name: string;
  uid: string;
  sortable: boolean;
};

export type StatusOptionDescriptor = {
  name: string;
  uid: string;
};

export type TournamentWithRelations = Tournament & {
  format: Format;
  matches: (Match & {
    deckA: DeckWithRelations;
    deckB: DeckWithRelations;
    winner: DeckWithRelations | null;
  })[];
  deckStats: (TournamentDeckStats & {
    deck: DeckWithRelations;
  })[];
};
