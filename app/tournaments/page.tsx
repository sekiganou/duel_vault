"use client";

import { Archetype, Deck, Format, Tournament } from "@/generated/prisma";
import {
  createTournament,
  updateTournament,
  getAllTournaments,
  deleteTournament,
  deleteTournaments,
} from "@/lib/api/tournaments";
import { getAllFormats } from "@/lib/api/formats";
import {
  TournamentWithRelations,
  StatusOptionDescriptor,
  TableColumnDescriptor,
  DeckWithRelations,
  TournamentType,
  GrandFinalType,
  RoundRobinMode,
} from "@/types";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import {
  ChangeEventHandler,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "@heroui/button";
import { Chip, ChipProps } from "@heroui/chip";
import { IconDotsVertical } from "@tabler/icons-react";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  select,
  Select,
  SelectedItems,
  Selection,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { capitalize, FullTable } from "@/components/fullTable";
import { useRouter } from "next/navigation";
import { getAllDecks } from "@/lib/api/decks";
import { Avatar } from "@heroui/avatar";
import { UpsertTournamentSchema } from "@/lib/schemas/tournaments";
import z from "zod";
import is from "zod/v4/locales/is.cjs";

const columns: TableColumnDescriptor[] = [
  { name: "ID", uid: "id", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "FORMAT", uid: "format", sortable: true },
  { name: "START DATE", uid: "startDate", sortable: true },
  { name: "END DATE", uid: "endDate", sortable: true },
  { name: "STATUS", uid: "status", sortable: false },
  { name: "MATCHES", uid: "matchCount", sortable: true },
  { name: "PARTICIPANTS", uid: "participants", sortable: true },
  { name: "ACTIONS", uid: "actions", sortable: false },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "format",
  "startDate",
  "endDate",
  "status",
  "matchCount",
  "participants",
  "actions",
];

const statusOptions: StatusOptionDescriptor[] = [
  { name: "Upcoming", uid: "upcoming" },
  { name: "Active", uid: "active" },
  { name: "Completed", uid: "completed" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  upcoming: "primary",
  active: "success",
  completed: "default",
};

const getTournamentStatus = (tournament: TournamentWithRelations): string => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = tournament.endDate ? new Date(tournament.endDate) : null;

  if (now < startDate) return "upcoming";
  if (endDate && now > endDate) return "completed";
  return "active";
};

const DeleteModal = ({
  isOpen,
  onOpenChange,
  tournament,
  handleGetAllTournaments,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: TournamentWithRelations | null;
  handleGetAllTournaments: () => Promise<void>;
}) => {
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = () => {
    if (!tournament) return;

    setLoadingDelete(true);
    deleteTournament(tournament.id)
      .then(() => {
        handleGetAllTournaments();
        onOpenChange(false);
      })
      .finally(() => setLoadingDelete(false));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Delete Tournament</ModalHeader>
            <ModalBody>
              <p>
                Are you sure you want to delete the tournament{" "}
                <strong>{tournament?.name}</strong>?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="default" onPress={onClose}>
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
  formats,
  handleGetAllTournaments,
  tournament,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formats: Format[];
  handleGetAllTournaments: () => Promise<void>;
  tournament: TournamentWithRelations | null;
}) => {
  const isEdit = !!tournament;
  const [decks, setDecks] = useState<DeckWithRelations[]>();
  const [mappedDecksIdName, setMappedDecksIdName] = useState<
    Map<number, string>
  >(new Map());

  const [tournamentType, setTournamentType] = useState<string>(
    TournamentType.SINGLE_ELIMINATION
  );

  const [grandFinalType, setGrandFinalType] = useState<string>(
    GrandFinalType.NONE
  );
  const [roundRobinMode, setRoundRobinMode] = useState<string>(
    RoundRobinMode.SIMPLE
  );

  const [groupCount, setGroupCount] = useState<number>(1);

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentFormatId, setTournamentFormatId] = useState("");
  const [tournamentStartDate, setTournamentStartDate] = useState("");
  const [tournamentEndDate, setTournamentEndDate] = useState("");
  const [tournamentNotes, setTournamentNotes] = useState("");
  const [tournamentLink, setTournamentLink] = useState("");
  const [loadingCreateTournament, setLoadingCreateTournament] = useState(false);
  const [tournamentNameInputError, setTournamentNameInputError] = useState("");
  const [
    tournamentParticipantsInputError,
    setTournamentParticipantsInputError,
  ] = useState("");
  const [participantsTouched, setParticipantsTouched] = useState(false);
  const [tournamentParticipants, setTournamentParticipants] =
    useState<Selection>(new Set([]));

  useEffect(() => {
    handleReset();
    getAllDecks().then((decks) => {
      setDecks(decks);
      const deckMap = new Map<number, string>();
      decks.forEach((deck) => {
        deckMap.set(deck.id, deck.name);
      });
      setMappedDecksIdName(deckMap);
    });
  }, [isOpen, tournament]);

  const handleReset = () => {
    if (isEdit && tournament) {
      setTournamentName(tournament.name);
      setTournamentFormatId(tournament.formatId.toString());
      setTournamentStartDate(
        new Date(tournament.startDate).toISOString().slice(0, 16)
      );
      setTournamentEndDate(
        tournament.endDate
          ? new Date(tournament.endDate).toISOString().slice(0, 16)
          : ""
      );
      setTournamentNotes(tournament.notes || "");
      setTournamentLink(tournament.link || "");
      setTournamentParticipants(
        new Set(tournament.deckStats.map((ds) => ds.deckId.toString()))
      );
    } else {
      setTournamentType(TournamentType.SINGLE_ELIMINATION);
      setGrandFinalType(GrandFinalType.NONE);
      setRoundRobinMode(RoundRobinMode.SIMPLE);
      setGroupCount(1);
      setTournamentName("");
      setTournamentFormatId("");
      setTournamentStartDate(new Date().toISOString().slice(0, 16));
      setTournamentEndDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      );
      setTournamentNotes("");
      setTournamentLink("");
      setTournamentParticipants(new Set([]));
    }
    setTournamentNameInputError("");
    setParticipantsTouched(false);
  };

  const handleCreateTournament = () => {
    setLoadingCreateTournament(true);
    const tournamentData = {
      name: tournamentName,
      formatId: Number(tournamentFormatId),
      startDate: new Date(tournamentStartDate),
      endDate: tournamentEndDate ? new Date(tournamentEndDate) : undefined,
      notes: tournamentNotes || undefined,
      link: tournamentLink || undefined,
      participants: Array.from(tournamentParticipants).map((p) => ({
        id: Number(p),
        name: mappedDecksIdName.get(Number(p))!,
      })),
      bracket: {
        type: tournamentType as TournamentType,
        settings: {
          grandFinal: grandFinalType as GrandFinalType,
          groupCount: groupCount,
          roundRobinMode: roundRobinMode as RoundRobinMode,
        },
      },
    };

    const operation = isEdit
      ? updateTournament({ id: tournament!.id.toString(), ...tournamentData })
      : createTournament(tournamentData);

    operation
      .then(() => {
        handleGetAllTournaments();
        onOpenChange(false);
      })
      .finally(() => {
        setLoadingCreateTournament(false);
      });
  };

  const isTournamentParticipantsValid =
    Array.from(tournamentParticipants).length >= 2;

  const isFormValid =
    tournamentName.trim() &&
    tournamentFormatId &&
    tournamentStartDate &&
    isTournamentParticipantsValid;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
              {isEdit ? "Edit" : "Add New"} Tournament{" "}
              {isEdit ? tournament?.name : ""}
            </ModalHeader>

            <ModalBody className="space-y-2">
              <Input
                placeholder="Tournament name"
                type="text"
                label="Name"
                isRequired
                isClearable
                value={tournamentName}
                onValueChange={(val) => {
                  setTournamentName(val);
                  if (val.trim()) setTournamentNameInputError("");
                  else if (val === "")
                    setTournamentNameInputError("Please fill out this field.");
                }}
                onClear={() => {
                  setTournamentName("");
                  setTournamentNameInputError("Please fill out this field.");
                }}
                isInvalid={!!tournamentNameInputError}
                errorMessage={tournamentNameInputError}
              />
              {!isEdit && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Format"
                      placeholder="Select format"
                      selectedKeys={[tournamentFormatId]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setTournamentFormatId(e.target.value)
                      }
                      isRequired
                    >
                      {formats.map((format) => (
                        <SelectItem key={format.id.toString()}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      label="Type"
                      placeholder="Select type"
                      selectedKeys={[tournamentType]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setTournamentType(e.target.value as TournamentType)
                      }
                      isRequired
                      // description={
                      //   tournamentType === TournamentType.SINGLE_ELIMINATION
                      //     ? "Single elimination bracket - lose once and you're out"
                      //     : tournamentType === TournamentType.DOUBLE_ELIMINATION
                      //       ? "Double elimination bracket - winners and losers brackets"
                      //       : "Round robin - everyone plays everyone"
                      // }
                    >
                      <SelectItem key={TournamentType.SINGLE_ELIMINATION}>
                        Single Elimination
                      </SelectItem>
                      <SelectItem key={TournamentType.DOUBLE_ELIMINATION}>
                        Double Elimination
                      </SelectItem>
                      <SelectItem key={TournamentType.ROUND_ROBIN}>
                        Round Robin
                      </SelectItem>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Grand Final Type"
                      placeholder="Select grand final type"
                      isDisabled={tournamentType === TournamentType.ROUND_ROBIN}
                      selectedKeys={[grandFinalType]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setGrandFinalType(e.target.value as GrandFinalType)
                      }
                    >
                      <SelectItem key={GrandFinalType.NONE}>None</SelectItem>
                      <SelectItem key={GrandFinalType.SIMPLE}>
                        Simple
                      </SelectItem>
                      <SelectItem key={GrandFinalType.DOUBLE}>
                        Double
                      </SelectItem>
                    </Select>
                    <Select
                      label="Round Robin Mode"
                      placeholder="Select round robin mode"
                      isDisabled={tournamentType !== TournamentType.ROUND_ROBIN}
                      selectedKeys={[roundRobinMode]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRoundRobinMode(e.target.value as RoundRobinMode)
                      }
                    >
                      <SelectItem key={RoundRobinMode.SIMPLE}>
                        Simple
                      </SelectItem>
                      <SelectItem key={RoundRobinMode.DOUBLE}>
                        Double
                      </SelectItem>
                    </Select>
                    <Input
                      label="Group Count"
                      placeholder="Select number of groups"
                      type="number"
                      min={1}
                      value={groupCount.toString()}
                      onChange={(e) => setGroupCount(Number(e.target.value))}
                      className="w-full"
                      isDisabled={tournamentType !== TournamentType.ROUND_ROBIN}
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  label="Start Date"
                  isRequired
                  value={tournamentStartDate}
                  onChange={(e) => setTournamentStartDate(e.target.value)}
                />
                <Input
                  type="datetime-local"
                  label="End Date (Optional)"
                  value={tournamentEndDate}
                  onChange={(e) => setTournamentEndDate(e.target.value)}
                />
              </div>
              <Select
                label="Participants"
                placeholder="Select all the participants"
                isRequired
                selectedKeys={tournamentParticipants}
                onSelectionChange={(keys) => {
                  setTournamentParticipants(keys);
                  setParticipantsTouched(true);
                  if (Array.from(keys).length >= 2) {
                    setTournamentParticipantsInputError("");
                  } else {
                    setTournamentParticipantsInputError(
                      "Please select at least two participants."
                    );
                  }
                }}
                onClear={() => {
                  setTournamentParticipants(new Set([]));
                  setTournamentParticipantsInputError(
                    "Please select at least two participants."
                  );
                }}
                isClearable
                isDisabled={isEdit}
                selectionMode="multiple"
                isMultiline
                errorMessage={tournamentParticipantsInputError}
                isInvalid={
                  participantsTouched && !isTournamentParticipantsValid
                }
                renderValue={(items) => (
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto py-1">
                    {items.map((item) => (
                      <Chip key={item.key} color="default" variant="faded">
                        {mappedDecksIdName.get(Number(item.key))}
                      </Chip>
                    ))}
                  </div>
                )}
              >
                {(tournamentFormatId
                  ? decks?.filter(
                      (deck) => deck.formatId === Number(tournamentFormatId)
                    )!
                  : []
                ).map((deck) => (
                  <SelectItem key={deck.id.toString()}>
                    <div className="flex gap-2 items-center">
                      <Avatar
                        alt={deck.name}
                        className="shrink-0"
                        size="sm"
                        src={deck.avatar ?? ""}
                      />
                      <div className="flex flex-col">
                        <span className="text-small">{deck.name}</span>
                        <span className="text-tiny text-default-400">
                          {deck.archetype.name}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Notes (Optional)"
                placeholder="Add tournament notes or description"
                value={tournamentNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTournamentNotes(e.target.value)
                }
                className="w-full"
              />
            </ModalBody>

            <ModalFooter>
              <Button variant="light" color="default" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleCreateTournament}
                isLoading={loadingCreateTournament}
                isDisabled={!isFormValid}
              >
                {isEdit ? "Update Tournament" : "Create Tournament"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentWithRelations[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [deletingTournaments, setDeletingTournaments] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<TournamentWithRelations | null>(null);
  const router = useRouter();

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

  const handleGetAllTournaments = () =>
    getAllTournaments()
      .then(setTournaments)
      .finally(() => {
        setLoadingTournaments(false);
      });

  useEffect(() => {
    async function fetchData() {
      handleGetAllTournaments();
      getAllFormats().then(setFormats);
    }

    fetchData();
  }, []);

  const renderCell = useCallback(
    (tournament: TournamentWithRelations, columnKey: React.Key) => {
      const cellValue = tournament[columnKey as keyof TournamentWithRelations];

      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {tournament.name}
              </p>
              {tournament.link && (
                <a
                  href={tournament.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  External Link
                </a>
              )}
            </div>
          );
        case "format":
          return (
            <span className="text-bold text-small capitalize">
              {tournament.format.name}
            </span>
          );
        case "startDate":
          return (
            <span className="text-small">
              {new Date(tournament.startDate).toLocaleDateString()}
            </span>
          );
        case "endDate":
          return tournament.endDate ? (
            <span className="text-small">
              {new Date(tournament.endDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-small text-default-400">-</span>
          );
        case "status":
          const status = getTournamentStatus(tournament);
          return (
            <Chip color={statusColorMap[status]} size="sm" variant="flat">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          );
        case "matchCount":
          return (
            <span className="text-small">{tournament.matches.length}</span>
          );
        case "participants":
          return (
            <span className="text-small">{tournament.deckStats.length}</span>
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
                    key="view"
                    onPress={() => {
                      router.push(`/tournaments/${tournament.id}`);
                    }}
                  >
                    View
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    onPress={() => {
                      setSelectedTournament(tournament);
                      onOpenEditModal();
                    }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    color="danger"
                    className="text-danger"
                    onPress={() => {
                      setSelectedTournament(tournament);
                      onOpenDeleteModal();
                    }}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return <span>{cellValue?.toString()}</span>;
      }
    },
    [onOpenEditModal, onOpenDeleteModal, router]
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tournaments</h1>
      </div>

      <FullTable
        columns={columns}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusOptions={statusOptions}
        items={tournaments}
        loadingItems={loadingTournaments}
        renderCell={renderCell}
        getStatus={getTournamentStatus}
        onOpenCreateModal={onOpenCreateModal}
        searchFilter={(
          tournament: TournamentWithRelations,
          filterValue: string
        ) =>
          tournament.name.toLowerCase().includes(filterValue.toLowerCase()) ||
          tournament.format.name
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        }
        getItemKey={(tournament: TournamentWithRelations) => tournament.id}
        getItemName={(tournament: TournamentWithRelations) => tournament.name}
        deleteItems={deleteTournaments}
        handleGetAllItems={handleGetAllTournaments}
      />

      <UpsertModal
        isOpen={isOpenCreateModal || isOpenEditModal}
        onOpenChange={
          isOpenCreateModal ? onOpenCreateModalChange : onOpenEditModalChange
        }
        formats={formats}
        handleGetAllTournaments={handleGetAllTournaments}
        tournament={isOpenCreateModal ? null : selectedTournament}
      />

      <DeleteModal
        isOpen={isOpenDeleteModal}
        onOpenChange={onOpenDeleteModalChange}
        tournament={selectedTournament}
        handleGetAllTournaments={handleGetAllTournaments}
      />
    </div>
  );
}
