import { StatusOptionDescriptor, TableColumnDescriptor } from "@/types";
import { Button } from "@heroui/button";
import { ChipProps } from "@heroui/chip";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Selection, SortDescriptor } from "@react-types/shared";
import {
  IconChevronDown,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { Key, useCallback, useEffect, useMemo, useState } from "react";
import z from "zod";
import { MatchWithRelations } from "@/types";

interface FullTableProps<T> {
  columns: TableColumnDescriptor[];
  initialVisibleColumns: string[];
  statusOptions: StatusOptionDescriptor[] | null;
  items: T[];
  searchFilter: (item: T, filterValue: string) => boolean;
  loadingItems: boolean;
  renderCell: (item: T, columnKey: Key) => JSX.Element;
  onOpenCreateModal: () => void;
  getStatus: (item: T) => string;
  getItemKey: (item: T) => number;
  getItemName: (item: T) => string;
  deleteItems: (ids: number[]) => Promise<void>;
  handleGetAllItems: () => Promise<void>;
  isReadOnly?: boolean;
  onRowAction?: (item: Key) => void;
}

const DeleteModal = <T,>({
  isOpen,
  onOpenChange,
  items,
  deleteItems,
  handleGetAllItems,
  getItemName,
  getItemKey,
  emptySelectedKeys,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  deleteItems: (ids: number[]) => Promise<void>;
  handleGetAllItems: () => Promise<void>;
  getItemName: (item: T) => string;
  getItemKey: (item: T) => number;
  emptySelectedKeys: () => void;
}) => {
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = () => {
    setLoadingDelete(true);
    deleteItems(items.map((item) => getItemKey(item)))
      .then(() => {
        onOpenChange(false);
        handleGetAllItems();
      })
      .finally(() => {
        setLoadingDelete(false);
        emptySelectedKeys();
      });
  };
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Delete Items</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to delete the following items?</p>
              <ul className="list-disc list-inside ml-4 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <li key={index}>
                    <b>{getItemName(item)}</b>
                  </li>
                ))}
              </ul>
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

export const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

export const FullTable = <T,>(props: FullTableProps<T>) => {
  const {
    columns,
    initialVisibleColumns,
    statusOptions,
    items,
    loadingItems,
    renderCell,
    onOpenCreateModal,
    getStatus,
    searchFilter,
    getItemKey,
    deleteItems,
    getItemName,
    handleGetAllItems,
    isReadOnly = false,
    onRowAction = null,
  } = props;

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(initialVisibleColumns)
  );
  const {
    isOpen: isOpenDeleteModal,
    onOpen: onOpenDeleteModal,
    onOpenChange: onOpenDeleteModalChange,
  } = useDisclosure();

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let copiedItems = [...items];

    if (
      statusFilter !== "all" &&
      statusOptions &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      copiedItems = copiedItems.filter((item) =>
        Array.from(statusFilter).includes(getStatus(item))
      );
    }

    if (hasSearchFilter) {
      copiedItems = copiedItems.filter((item) =>
        searchFilter(item, filterValue)
      );
    }

    return copiedItems;
  }, [items, filterValue, statusFilter]);

  const memoizedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const sortedItems = useMemo(() => {
    return [...memoizedItems].sort((a: T, b: T) => {
      const first = a[sortDescriptor.column as keyof T] as number;
      const second = b[sortDescriptor.column as keyof T] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, memoizedItems]);

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
                {statusOptions &&
                  statusOptions.map((status) => (
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
            {selectedKeys === "all" || selectedKeys.size > 0 ? (
              <Button
                color="default"
                endContent={<IconTrash />}
                onPress={() => {
                  onOpenDeleteModal();
                }}
                isDisabled={isReadOnly}
              >
                Delete{" "}
                {selectedKeys === "all" ? items.length : selectedKeys.size}{" "}
                items
              </Button>
            ) : (
              <Button
                color="primary"
                endContent={<IconPlus />}
                onPress={onOpenCreateModal}
                isDisabled={isReadOnly}
              >
                Add New
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {items.length} items
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
    items.length,
    selectedKeys,
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
  }, [selectedKeys, memoizedItems.length, page, pages, hasSearchFilter]);

  return (
    <>
      <Table
        isHeaderSticky
        aria-label="Full Table"
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
        onRowAction={onRowAction ?? undefined}
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
          emptyContent={"No items found"}
          items={sortedItems}
          isLoading={loadingItems}
          loadingContent={<Spinner />}
        >
          {(item) => (
            <TableRow key={getItemKey(item)}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DeleteModal
        isOpen={isOpenDeleteModal}
        onOpenChange={onOpenDeleteModalChange}
        items={
          selectedKeys === "all"
            ? items
            : items.filter((item) =>
                (selectedKeys as Set<string>).has(getItemKey(item).toString())
              )
        }
        deleteItems={deleteItems}
        getItemName={getItemName}
        getItemKey={getItemKey}
        handleGetAllItems={handleGetAllItems}
        emptySelectedKeys={() => setSelectedKeys(new Set())}
      />
    </>
  );
};
