"use client";

import { Archetype, Format } from "@/generated/prisma";
import { createDeck, getAllDecks } from "@/lib/api/decks";
import { Deck, StatusOptionDescriptor, TableColumnDescriptor } from "@/types";
import { User } from "@heroui/user";
import { Selection } from "@react-types/shared";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { ChangeEvent, Key, useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip, ChipProps } from "@heroui/chip";
import { IconDotsVertical, IconPlus } from "@tabler/icons-react";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { createArchetype, getAllArchetypes } from "@/lib/api/archetypes";
import { getAllFormats } from "@/lib/api/formats";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { FullTable } from "@/components/fullTable";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";

const columns: TableColumnDescriptor[] = [
  { name: "ID", uid: "id", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "FORMAT", uid: "format", sortable: true },
  { name: "STATUS", uid: "active", sortable: false },
  { name: "WINS", uid: "wins", sortable: true },
  { name: "LOSSES", uid: "losses", sortable: true },
  { name: "TIES", uid: "ties", sortable: true },
  { name: "ACTIONS", uid: "actions", sortable: false },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "format",
  "active",
  "wins",
  "losses",
  "ties",
  "actions",
];

const statusOptions: StatusOptionDescriptor[] = [
  { name: "Active", uid: "active" },
  { name: "Inactive", uid: "inactive" },
];

const getStatus = (deck: Deck) => (deck.active ? "active" : "inactive");

const statusColorMap: Record<string, ChipProps["color"]> = {
  active: "success",
  inactive: "danger",
};

const CreateModal = ({
  isOpen,
  onOpenChange,
  formats,
  archetypes,
  handleGetAllDecks,
  handleGetAllArchetypes,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formats: Format[];
  archetypes: Archetype[];
  handleGetAllDecks: () => Promise<void>;
  handleGetAllArchetypes: () => Promise<void>;
}) => {
  const [deckAvatarName, setDeckAvatarName] = useState("");
  const [deckAvatarFile, setDeckAvatarFile] = useState<File | null>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckIsActive, setDeckIsActive] = useState(true);
  const [deckArchetypeId, setDeckArchetypeId] = useState<Key | null>("");
  const [deckFormatId, setDeckFormatId] = useState<string>("");
  const [archetypeName, setArchetypeName] = useState("");
  const [loadingCreateDeck, setLoadingCreateDeck] = useState(false);
  const [deckNameInputError, setDeckNameInputError] = useState("");
  const [loadingCreateArchetype, setLoadingCreateArchetype] = useState(false);

  useEffect(() => {
    handleReset();
  }, [isOpen]);

  const handleReset = () => {
    setDeckAvatarFile(null);
    setDeckAvatarName("");
    setDeckName("");
    setDeckDescription("");
    setDeckFormatId("");
    setDeckArchetypeId("");
    setDeckIsActive(true);
  };

  const handleCreateAndSetArchetype = () => {
    setLoadingCreateArchetype(true);
    createArchetype({
      name: archetypeName,
    })
      .then(() => handleGetAllArchetypes())
      .finally(() => setLoadingCreateArchetype(false));
  };

  const handleCreateDeck = () => {
    setLoadingCreateDeck(true);
    createDeck(
      {
        name: deckName,
        formatId: Number(deckFormatId),
        archetypeId: Number(deckArchetypeId),
        description: deckDescription,
        active: deckIsActive,
      },
      deckAvatarFile
    )
      .then(() => {
        handleGetAllDecks();
        onOpenChange(false);
      })
      .finally(() => {
        setLoadingCreateDeck(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
              Add New Deck
            </ModalHeader>

            <ModalBody className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg max-w-lg shadow-sm">
                <div className="shrink-0">
                  <Avatar
                    radius="lg"
                    src={
                      deckAvatarFile ? URL.createObjectURL(deckAvatarFile) : ""
                    }
                    alt="Avatar Preview"
                    className="w-20 h-20"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    label="Avatar"
                    className="w-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setDeckAvatarFile(file);
                      setDeckAvatarName(e.target.value);
                    }}
                    isClearable
                    onClear={() => {
                      setDeckAvatarName("");
                      setDeckAvatarFile(null);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-md">
                <Input
                  type="text"
                  label="Name"
                  isRequired
                  isClearable
                  value={deckName}
                  onValueChange={(val) => {
                    setDeckName(val);
                    if (val.trim()) setDeckNameInputError("");
                    else if (val === "")
                      setDeckNameInputError("Please fill out this field.");
                  }}
                  onClear={() => {
                    setDeckName("");
                    setDeckNameInputError("Please fill out this field."); // optional
                  }}
                  isInvalid={!!deckNameInputError}
                  errorMessage={deckNameInputError}
                />
                <Input
                  type="text"
                  label="Description"
                  value={deckDescription}
                  onValueChange={setDeckDescription}
                  isClearable
                  onClear={() => setDeckDescription("")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <Autocomplete
                  defaultItems={archetypes}
                  label="Archetype"
                  isRequired
                  selectedKey={deckArchetypeId?.toString()}
                  onSelectionChange={setDeckArchetypeId}
                  onValueChange={(e) => setArchetypeName(e)}
                  listboxProps={{
                    emptyContent: (
                      <Button
                        size="sm"
                        startContent={<IconPlus size={16} />}
                        onPress={handleCreateAndSetArchetype}
                        isLoading={loadingCreateArchetype}
                      >
                        "{archetypeName}"
                      </Button>
                    ),
                  }}
                >
                  {(archetype) => (
                    <AutocompleteItem
                      key={archetype.id.toString()}
                      className="capitalize"
                    >
                      {archetype.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Select
                  label="Format"
                  isRequired
                  selectedKeys={[deckFormatId]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDeckFormatId(e.target.value)
                  }
                >
                  {formats.map((format) => (
                    <SelectItem
                      key={format.id.toString()}
                      className="capitalize"
                    >
                      {format.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  isSelected={deckIsActive}
                  onValueChange={setDeckIsActive}
                />
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-between">
              <Button variant="light" color="danger" onPress={onClose}>
                Close
              </Button>
              <Button
                color="primary"
                onPress={handleCreateDeck}
                isLoading={loadingCreateDeck}
                isDisabled={
                  deckName == "" ||
                  deckArchetypeId === "" ||
                  deckFormatId === "" ||
                  loadingCreateDeck
                }
              >
                Save
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default function DecksPage() {
  const [isClient, setIsClient] = useState(false);
  const [decks, setDecks] = useState(new Array<Deck>());
  const [formats, setFormats] = useState(new Array<Format>());
  const [archetypes, setArchetypes] = useState(new Array<Archetype>());
  const [loadingDecks, setLoadingDecks] = useState(false);
  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onOpenChange: onOpenCreateModalChange,
  } = useDisclosure();

  const handleGetAllDecks = () =>
    getAllDecks()
      .then(setDecks)
      .finally(() => {
        setLoadingDecks(false);
        setIsClient(true);
      });

  const handleGetAllArchetypes = () => getAllArchetypes().then(setArchetypes);

  useEffect(() => {
    setLoadingDecks(true);
    handleGetAllDecks();
    handleGetAllArchetypes();
    getAllFormats().then(setFormats);
  }, []);

  const renderCell = useCallback((deck: Deck, columnKey: React.Key) => {
    const cellValue = deck[columnKey as keyof Deck];

    switch (columnKey) {
      case "name":
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
            {deck.name}
          </User>
        );
      case "format":
        return (
          <span className="text-bold text-small capitalize">
            {deck.format.name}
          </span>
        );
      case "active":
        return (
          <Chip
            className="capitalize"
            variant="flat"
            color={statusColorMap[getStatus(deck)]}
            size="sm"
          >
            {getStatus(deck)}
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
                <DropdownItem key="view">View</DropdownItem>
                <DropdownItem key="edit">Edit</DropdownItem>
                <DropdownItem key="delete">Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return <span>{cellValue?.toString()}</span>;
    }
  }, []);

  return (
    isClient && (
      <>
        <FullTable
          columns={columns}
          initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
          statusOptions={statusOptions}
          items={decks}
          loadingItems={loadingDecks}
          renderCell={renderCell}
          getStatus={getStatus}
          onOpenCreateModal={onOpenCreateModal}
          searchFilter={(deck: Deck, filterValue: string) =>
            deck.name.toLowerCase().includes(filterValue.toLowerCase())
          }
          getItemKey={(deck: Deck) => deck.id}
        />
        <CreateModal
          isOpen={isOpenCreateModal}
          onOpenChange={onOpenCreateModalChange}
          formats={formats}
          archetypes={archetypes}
          handleGetAllDecks={handleGetAllDecks}
          handleGetAllArchetypes={handleGetAllArchetypes}
        />
      </>
    )
  );
}
