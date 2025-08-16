import {
  Archetype,
  Bracket,
  BracketNode,
  BracketNodeConnection,
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


type BracketNodeWithRelations = BracketNode & {
  connectionsFrom: BracketNodeConnection[];
  connectionsTo: BracketNodeConnection[];
}
type BracketWithRelations = Bracket & { nodes: BracketNodeWithRelations[] };

export type TournamentWithRelations = Tournament & {
  format: Format;
  matches: (Match & {
    deckA: DeckWithRelations | null;
    deckB: DeckWithRelations | null;
    winner: DeckWithRelations | null;
  })[];
  deckStats: (TournamentDeckStats & {
    deck: DeckWithRelations;
  })[];
  bracket: BracketWithRelations;
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
