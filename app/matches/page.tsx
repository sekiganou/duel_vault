"use client";

import { Tournament } from "@/generated/prisma";
import {
  upsertMatch,
  getAllMatches,
  deleteMatch,
  getMatchStatus,
} from "@/lib/api/matches";
import { getAllDecks } from "@/lib/api/decks";
import {
  DeckWithRelations,
  MatchWithRelations,
  StatusOptionDescriptor,
  TableColumnDescriptor,
} from "@/types";
import { Selection } from "@react-types/shared";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Key, useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip, ChipProps } from "@heroui/chip";
import { IconDotsVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { FullTable } from "@/components/fullTable";
import { addToast } from "@heroui/toast";
import { Input } from "@heroui/input";
import { User } from "@heroui/user";
import { getAllTournaments } from "@/lib/api/tournaments";
import Link from "next/link";

const columns: TableColumnDescriptor[] = [
  { name: "ID", uid: "id", sortable: true },
  { name: "DECK A", uid: "deckA", sortable: true },
  { name: "DECK B", uid: "deckB", sortable: true },
  { name: "RESULT", uid: "result", sortable: false },
  { name: "SCORE", uid: "score", sortable: false },
  { name: "DATE", uid: "date", sortable: true },
  { name: "TOURNAMENT", uid: "tournament", sortable: true },
  { name: "ACTIONS", uid: "actions", sortable: false },
];

const INITIAL_VISIBLE_COLUMNS = [
  "deckA",
  "deckB",
  "result",
  "score",
  "date",
  "tournament",
  "actions",
];

const statusOptions: StatusOptionDescriptor[] = [
  { name: "Tournament Matches", uid: "tournament" },
  { name: "Friendly Matches", uid: "friendly" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  tournament: "primary",
  friendly: "secondary",
};

const DeleteModal = ({
  isOpen,
  onOpenChange,
  match,
  handleGetAllMatches,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchWithRelations | null;
  handleGetAllMatches: () => Promise<void>;
}) => {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const handleDelete = () => {
    if (!match) return;

    setLoadingDelete(true);
    deleteMatch(match.id)
      .then(() => {
        handleGetAllMatches();
        onOpenChange(false);
      })
      .finally(() => setLoadingDelete(false));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Delete Match
            </ModalHeader>
            <ModalBody>
              <p>
                Are you sure you want to delete this match between{" "}
                <strong>{match?.deckA.name}</strong> and{" "}
                <strong>{match?.deckB.name}</strong>?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={loadingDelete}
              >
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

const UpsertModal = ({
  isOpen,
  onOpenChange,
  decks,
  tournaments,
  handleGetAllMatches,
  match,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  decks: DeckWithRelations[];
  tournaments: Tournament[];
  handleGetAllMatches: () => Promise<void>;
  match: MatchWithRelations | null;
}) => {
  const isEdit = !!match;
  const [tournamentId, setTournamentId] = useState<string>("");
  const [deckAId, setDeckAId] = useState<string>("");
  const [deckBId, setDeckBId] = useState<string>("");
  const [winnerId, setWinnerId] = useState<string>("");
  const [deckAScore, setDeckAScore] = useState("");
  const [deckBScore, setDeckBScore] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [loadingCreateMatch, setLoadingCreateMatch] = useState(false);

  const getDeckName = (deck: DeckWithRelations) =>
    `${deck.name} (${deck.archetype.name})`;

  useEffect(() => {
    handleReset();
  }, [isOpen, match]);

  const handleReset = () => {
    if (match) {
      setTournamentId(match.tournamentId?.toString() || "");
      setDeckAId(match.deckAId.toString());
      setDeckBId(match.deckBId.toString());
      setWinnerId(match.winnerId?.toString() || "");
      setDeckAScore(match.deckAScore.toString());
      setDeckBScore(match.deckBScore.toString());
      setNotes(match.notes || "");
      setDate(new Date(match.date).toISOString().slice(0, 16));
    } else {
      setTournamentId("");
      setDeckAId("");
      setDeckBId("");
      setWinnerId("");
      setDeckAScore("0");
      setDeckBScore("0");
      setNotes("");
      setDate(new Date().toISOString().slice(0, 16));
    }
  };

  const handleCreateMatch = () => {
    setLoadingCreateMatch(true);
    upsertMatch({
      id: match?.id ?? null,
      tournamentId: tournamentId ? Number(tournamentId) : null,
      deckAId: Number(deckAId),
      deckBId: Number(deckBId),
      winnerId: winnerId ? Number(winnerId) : null,
      deckAScore: Number(deckAScore),
      deckBScore: Number(deckBScore),
      notes: notes || null,
      date: new Date(date).toISOString(),
    })
      .then(() => {
        handleGetAllMatches();

        onOpenChange(false);
      })
      .finally(() => {
        setLoadingCreateMatch(false);
      });
  };

  const isFormValid = deckAId && deckBId && deckAId !== deckBId && date;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isEdit ? "Edit Match" : "Create New Match"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <Select
                  label="Tournament (Optional)"
                  placeholder="Select a tournament"
                  selectedKeys={[tournamentId]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTournamentId(e.target.value)
                  }
                >
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id.toString()}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="datetime-local"
                  label="Match Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  isRequired
                />

                <Select
                  label="Deck A"
                  placeholder="Select first deck"
                  selectedKeys={[deckAId]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDeckAId(e.target.value)
                  }
                  isRequired
                >
                  {decks
                    .filter((deck) => deck.id.toString() !== deckBId)
                    .map((deck) => (
                      <SelectItem key={deck.id.toString()}>
                        {getDeckName(deck)}
                      </SelectItem>
                    ))}
                </Select>

                <Select
                  label="Deck B"
                  placeholder="Select second deck"
                  selectedKeys={[deckBId]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDeckBId(e.target.value)
                  }
                  isRequired
                >
                  {decks
                    .filter((deck) => deck.id.toString() !== deckAId)
                    .map((deck) => (
                      <SelectItem key={deck.id}>{getDeckName(deck)}</SelectItem>
                    ))}
                </Select>

                <Input
                  type="number"
                  label="Deck A Score"
                  value={deckAScore}
                  onChange={(e) => {
                    setDeckAScore(e.target.value);
                    setWinnerId(
                      Number(e.target.value) == Number(deckBScore)
                        ? ""
                        : Number(e.target.value) > Number(deckBScore)
                          ? deckAId
                          : deckBId
                    );
                  }}
                  min="0"
                  isRequired
                />

                <Input
                  type="number"
                  label="Deck B Score"
                  value={deckBScore}
                  onChange={(e) => {
                    setDeckBScore(e.target.value);
                    setWinnerId(
                      Number(e.target.value) == Number(deckAScore)
                        ? ""
                        : Number(e.target.value) > Number(deckAScore)
                          ? deckBId
                          : deckAId
                    );
                  }}
                  min="0"
                  isRequired
                />

                <div className="md:col-span-2">
                  <Select
                    label="Winner (Optional)"
                    placeholder="Select winner or leave empty for tie"
                    selectedKeys={[winnerId]}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setWinnerId(e.target.value)
                    }
                  >
                    {[deckAId, deckBId].filter(Boolean).map((id) => {
                      const deck = decks.find((d) => d.id.toString() === id);
                      return deck ? (
                        <SelectItem key={deck.id}>
                          {getDeckName(deck)}
                        </SelectItem>
                      ) : null;
                    })}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Notes (Optional)"
                    placeholder="Add any notes about this match"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleCreateMatch}
                isLoading={loadingCreateMatch}
                isDisabled={!isFormValid}
              >
                {isEdit ? "Update Match" : "Create Match"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithRelations[]>([]);
  const [decks, setDecks] = useState<DeckWithRelations[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithRelations | null>(
    null
  );

  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onOpenChange: onOpenCreateModalChange,
  } = useDisclosure();
  const {
    isOpen: isOpenDeleteModal,
    onOpen: onOpenDeleteModal,
    onOpenChange: onOpenDeleteModalChange,
  } = useDisclosure();
  const {
    isOpen: isOpenEditModal,
    onOpen: onOpenEditModal,
    onOpenChange: onOpenEditModalChange,
  } = useDisclosure();

  const handleGetAllMatches = async () => {
    try {
      const decks = await getAllDecks();
      setDecks(decks);

      const matches = await getAllMatches();
      setMatches(matches);

      const tournaments = await getAllTournaments();
      setTournaments(tournaments);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    handleGetAllMatches();
  }, []);

  const renderCell = useCallback(
    (match: MatchWithRelations, columnKey: React.Key) => {
      const cellValue = match[columnKey as keyof MatchWithRelations];
      switch (columnKey) {
        case "id":
          return <div className="font-bold">{match.id}</div>;
        case "deckA":
        case "deckB":
          const deck = columnKey === "deckA" ? match.deckA : match.deckB;
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: deck.avatar?.toString(),
                showFallback: true,
                className: "hidden md:block shrink-0",
              }}
              description={deck.archetype.name}
              name={deck.name}
              classNames={{ name: "text-bold text-small capitalize" }}
            >
              <div className="font-semibold">{deck.name}</div>
              <div className="text-xs text-default-500">
                {deck.archetype.name}
              </div>
            </User>
          );
        case "result":
          return (
            <Chip
              color={
                match.winner
                  ? match.winner.id === match.deckA.id
                    ? "success"
                    : "danger"
                  : "warning"
              }
              variant="flat"
              size="sm"
            >
              {match.winner
                ? match.winner.id === match.deckA.id
                  ? `${match.deckA.name} Wins`
                  : `${match.deckB.name} Wins`
                : "Tie"}
            </Chip>
          );
        case "score":
          return (
            <div className="font-mono">
              {match.deckAScore} - {match.deckBScore}
            </div>
          );
        case "date":
          return <div>{new Date(match.date).toLocaleDateString()}</div>;
        case "tournament":
          return (
            <Chip
              color={statusColorMap[getMatchStatus(match)]}
              variant="flat"
              size="sm"
              className="px-2 py-1 text-xs font-medium"
            >
              {match.tournament ? (
                <Link
                  href={`/tournaments/${match.tournament.id}`}
                  className="underline hover:text-primary transition-colors"
                >
                  {match.tournament.name}
                </Link>
              ) : (
                <span>Friendly Match</span>
              )}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <IconDotsVertical className="text-default-300" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="edit"
                    onPress={() => {
                      setSelectedMatch(match);
                      onOpenEditModal();
                    }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    onPress={() => {
                      setSelectedMatch(match);
                      onOpenDeleteModal();
                    }}
                    className="text-danger"
                    color="danger"
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return <div>{String(cellValue)}</div>;
      }
    },
    [onOpenEditModal, onOpenDeleteModal]
  );

  const searchFilter = (match: MatchWithRelations, filterValue: string) => {
    return (
      match.deckA.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      match.deckB.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      match.deckA.archetype.name
        .toLowerCase()
        .includes(filterValue.toLowerCase()) ||
      match.deckB.archetype.name
        .toLowerCase()
        .includes(filterValue.toLowerCase()) ||
      (match.tournament?.name
        .toLowerCase()
        .includes(filterValue.toLowerCase()) ??
        false)
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Matches</h1>
      </div>

      <FullTable<MatchWithRelations>
        columns={columns}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusOptions={statusOptions}
        items={matches}
        searchFilter={searchFilter}
        loadingItems={loadingMatches}
        renderCell={renderCell}
        onOpenCreateModal={() => {
          setSelectedMatch(null);
          onOpenCreateModal();
        }}
        getStatus={getMatchStatus}
        getItemKey={(match) => match.id}
      />

      <UpsertModal
        isOpen={isOpenCreateModal || isOpenEditModal}
        onOpenChange={
          isOpenCreateModal ? onOpenCreateModalChange : onOpenEditModalChange
        }
        decks={decks}
        tournaments={tournaments}
        handleGetAllMatches={handleGetAllMatches}
        match={selectedMatch}
      />

      <DeleteModal
        isOpen={isOpenDeleteModal}
        onOpenChange={onOpenDeleteModalChange}
        match={selectedMatch}
        handleGetAllMatches={handleGetAllMatches}
      />
    </div>
  );
}
