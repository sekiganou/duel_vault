"use client";

import { title } from "@/components/primitives";
import { Archetype, Format } from "@/generated/prisma";
import { getAllDecks } from "@/lib/api/decks";
import { Deck } from "@/types";
import { User } from "@heroui/user";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Selection, SortDescriptor } from "@react-types/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Chip, ChipProps } from "@heroui/chip";
import {
  IconChevronDown,
  IconDotsVertical,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { CircularProgress } from "@heroui/progress";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { getAllArchetypes } from "@/lib/api/archetypes";
import { getAllFormats } from "@/lib/api/formats";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "FORMAT", uid: "format", sortable: true },
  { name: "STATUS", uid: "active" },
  { name: "WINS", uid: "wins", sortable: true },
  { name: "LOSSES", uid: "losses", sortable: true },
  { name: "TIES", uid: "ties", sortable: true },
  { name: "ACTIONS", uid: "actions" },
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

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Inactive", uid: "inactive" },
];

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const getStatus = (deck: Deck) => (deck.active ? "active" : "inactive");

const statusColorMap: Record<string, ChipProps["color"]> = {
  active: "success",
  inactive: "danger",
};

export default function DecksPage() {
  const [isClient, setIsClient] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [decks, setDecks] = useState(new Array<Deck>());
  const [formats, setFormats] = useState(new Array<Format>());
  const [archetypes, setArchetypes] = useState(new Array<Archetype>());
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onOpenChange: onOpenCreateModalChange,
  } = useDisclosure();
  const [loadingCreateDeck, setLoadingCreateDeck] = useState(false);
  const [loadingCreateArchetype, setLoadingCreateArchetype] = useState(false);

  useEffect(() => {
    setLoadingDecks(true);
    getAllDecks()
      .then(setDecks)
      .finally(() => setLoadingDecks(false));
    setIsClient(true);
    getAllArchetypes().then(setArchetypes);
    getAllFormats().then(setFormats);
  }, []);

  const handleCreate = () => {};

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredDecks = [...decks];

    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredDecks = filteredDecks.filter((deck) =>
        Array.from(statusFilter).includes(getStatus(deck))
      );
    }

    if (hasSearchFilter) {
      filteredDecks = filteredDecks.filter((deck) =>
        deck.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredDecks;
  }, [decks, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Deck, b: Deck) => {
      const first = a[sortDescriptor.column as keyof Deck] as number;
      const second = b[sortDescriptor.column as keyof Deck] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

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
              className: "hidden md:block",
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
      case "wins":
        return <span>{deck.wins}</span>;
      case "losses":
        return <span>{deck.losses}</span>;
      case "ties":
        return <span>{deck.ties}</span>;
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

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<IconSearch />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<IconChevronDown className="text-small" />}
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<IconChevronDown className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<IconPlus />}
              onPress={onOpenCreateModal}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {decks.length} decks
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    decks.length,
    hasSearchFilter,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    isClient && (
      <>
        <Table
          isHeaderSticky
          aria-label="Decks Table"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "max-h-[382px]",
          }}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"No decks found"}
            items={sortedItems}
            isLoading={loadingDecks}
            loadingContent={<CircularProgress />}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Modal
          isOpen={isOpenCreateModal}
          onOpenChange={onOpenCreateModalChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
                  Add New Deck
                </ModalHeader>

                <ModalBody className="space-y-4">
                  <Input type="file" label="Avatar" className="max-w-md" />

                  <div className="flex flex-col gap-4 max-w-md">
                    <Input type="text" label="Name" isRequired />
                    <Input type="text" label="Description" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <Autocomplete
                      label="Archetype"
                      isRequired
                      listboxProps={{
                        emptyContent: (
                          <Button
                            size="sm"
                            startContent={<IconPlus size={16} />}
                          >
                            Add
                          </Button>
                        ),
                      }}
                    >
                      {archetypes.map((archetype) => (
                        <AutocompleteItem
                          key={archetype.id}
                          className="capitalize"
                        >
                          {archetype.name}
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                    <Autocomplete label="Format" isRequired>
                      {formats.map((format) => (
                        <AutocompleteItem
                          key={format.id}
                          className="capitalize"
                        >
                          {format.name}
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Switch defaultSelected />
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                </ModalBody>

                <ModalFooter className="flex justify-between">
                  <Button variant="light" color="danger" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Save
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    )
  );
}
