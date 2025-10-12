import {
  Archetype,
  Deck,
  Format,
  Match,
  Tournament,
  TournamentDeckStats,
  TournamentStages,
} from "@/generated/prisma";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type DeckWithRelations = Deck & {
  archetype: Archetype;
  format: Format;
  matchesA: (Match & {
    deckA: Deck & {
      archetype: Archetype;
      format: Format;
    };
    deckB: Deck & {
      archetype: Archetype;
      format: Format;
    };
    tournament: Tournament | null;
  })[];
  matchesB: (Match & {
    deckA: Deck & {
      archetype: Archetype;
      format: Format;
    };
    deckB: Deck & {
      archetype: Archetype;
      format: Format;
    };
    tournament: Tournament | null;
  })[];
  winsAs: Match[];
  tournamentStats: (TournamentDeckStats & {
    tournament: Tournament | null;
  })[];
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

export enum GrandFinalType {
  NONE = "none",
  SIMPLE = "simple",
  DOUBLE = "double",
}

export enum RoundRobinMode {
  SIMPLE = "simple",
  DOUBLE = "double",
}

export enum TournamentType {
  SINGLE_ELIMINATION = "single_elimination",
  DOUBLE_ELIMINATION = "double_elimination",
  ROUND_ROBIN = "round_robin",
}

export type StageData = {
  stages: any[];
  matches: any[];
  matchGames: any[];
  participants: any[];
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
  stages: (TournamentStages & {
    data: StageData;
  })[];
};

export type CardTabItem = {
  key: string;
  title: string;
  cardBody: React.ReactNode;
  emptyContent: {
    header: string;
    text: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    displayEmptyContent: boolean;
  };
};
