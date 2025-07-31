import { Archetype, deck, Format } from "@/generated/prisma";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Deck = deck & { archetype: Archetype; format: Format };

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
