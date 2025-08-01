import { Archetype, deck, Format, Match, Tournament } from "@/generated/prisma";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Deck = deck & {
  archetype: Archetype;
  format: Format;
};

export type MatchWithRelations = Match & {
  tournament: Tournament | null;
  deckA: deck & {
    archetype: Archetype;
    format: Format;
  };
  deckB: deck & {
    archetype: Archetype;
    format: Format;
  };
  winner:
    | (deck & {
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
