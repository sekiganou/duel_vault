import { upsertMatch } from "@/lib/api/matches";
import { DeckWithRelations, StageData, TournamentWithRelations } from "@/types";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { match } from "assert";
import { useEffect, useRef, useState } from "react";
import z from "zod";

const UpdateScoreModal = ({
  isOpen,
  onOpenChange,
  bracketMatchId,
  opponent1Id,
  opponent2Id,
  tournamentId,
  deckA,
  deckB,
  handleGetTournamentById,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  opponent1Id: number;
  opponent2Id: number;
  tournamentId: number;
  bracketMatchId: number;
  deckA: DeckWithRelations | null;
  deckB: DeckWithRelations | null;
  handleGetTournamentById: () => void;
}) => {
  // Early return with consistent JSX structure
  if (!deckA || !deckB) {
    return (
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Error</ModalHeader>
              <ModalBody>
                <p>Unable to load deck information. Please try again.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
  const mappedDecks: Map<number, DeckWithRelations> = new Map([
    [deckA.id, deckA],
    [deckB.id, deckB],
  ]);
  const [winnerId, setWinnerId] = useState<string>("");
  const [deckAScore, setDeckAScore] = useState("0");
  const [deckBScore, setDeckBScore] = useState("0");
  const [notes, setNotes] = useState("");
  const [loadingCreateMatch, setLoadingCreateMatch] = useState(false);

  useEffect(() => {
    setWinnerId("");
    setDeckAScore("0");
    setDeckBScore("0");
    setNotes("");
  }, [isOpen]);

  const handleCreateMatch = () => {
    setLoadingCreateMatch(true);
    upsertMatch({
      id: null,
      tournamentId: tournamentId ? Number(tournamentId) : null,
      deckAId: Number(deckA.id),
      deckBId: Number(deckB.id),
      winnerId: winnerId ? Number(winnerId) : null,
      deckAScore: Number(deckAScore),
      deckBScore: Number(deckBScore),
      notes: notes || null,
      date: new Date().toISOString(),
      bracket: {
        matchId: bracketMatchId,
        opponent1: opponent1Id,
        opponent2: opponent2Id,
      },
    })
      .then(() => {
        handleGetTournamentById();
        onOpenChange(false);
      })
      .finally(() => {
        setLoadingCreateMatch(false);
      });
  };

  const isFormValid = deckAScore && deckBScore && deckA && deckB;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Create Match
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-small font-medium mb-2 block">
                    Deck A
                  </label>
                  <div className="flex gap-2 items-center p-3 border border-default-300 rounded-lg bg-default-100">
                    <Avatar
                      alt={deckA.name}
                      className="shrink-0"
                      size="sm"
                      src={deckA.avatar ?? ""}
                    />
                    <div className="flex flex-col">
                      <span className="text-small font-medium">
                        {deckA.name}
                      </span>
                      <span className="text-tiny text-default-400">
                        {deckA.archetype.name + " • " + deckA.format.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-small font-medium mb-2 block">
                    Deck B
                  </label>
                  <div className="flex gap-2 items-center p-3 border border-default-300 rounded-lg bg-default-100">
                    <Avatar
                      alt={deckB.name}
                      className="shrink-0"
                      size="sm"
                      src={deckB.avatar ?? ""}
                    />
                    <div className="flex flex-col">
                      <span className="text-small font-medium">
                        {deckB.name}
                      </span>
                      <span className="text-tiny text-default-400">
                        {deckB.archetype.name + " • " + deckB.format.name}
                      </span>
                    </div>
                  </div>
                </div>

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
                          ? String(deckA.id)
                          : String(deckB.id)
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
                          ? String(deckB.id)
                          : String(deckA.id)
                    );
                  }}
                  min="0"
                  isRequired
                />

                <div className="md:col-span-2">
                  <Select
                    label="Winner (Optional)"
                    selectedKeys={[winnerId]}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setWinnerId(e.target.value)
                    }
                    classNames={{
                      label: "group-data-[filled=true]:-translate-y-4",
                    }}
                    renderValue={(items) => (
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => (
                          <div
                            className="flex gap-2 items-center"
                            key={item.key}
                          >
                            <Avatar
                              alt={mappedDecks.get(Number(item.key))?.name}
                              className="shrink-0"
                              size="sm"
                              src={
                                mappedDecks.get(Number(item.key))?.avatar ?? ""
                              }
                            />
                            <div className="flex flex-col">
                              <span className="text-small">
                                {mappedDecks.get(Number(item.key))?.name}
                              </span>
                              <span className="text-tiny text-default-400">
                                {
                                  mappedDecks.get(Number(item.key))?.archetype
                                    .name
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  >
                    {[deckA, deckB].map((deck) => (
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
                Create Match
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// BracketViewer component
export function BracketViewer({
  tournamentId,
  stageData,
  stageId,
  participantMapName,
  handleGetTournamentById,
}: {
  tournamentId: number;
  stageData: StageData; // Adjust the type as needed
  stageId: number;
  participantMapName: Map<string, DeckWithRelations>;
  handleGetTournamentById: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isOpen: isOpenUpdateScoreModal,
    onOpen: onOpenUpdateScoreModal,
    onOpenChange: onOpenUpdateScoreModalChange,
  } = useDisclosure();

  const participantMapId = new Map<number, DeckWithRelations>();
  stageData.participants.forEach((value, key) => {
    participantMapId.set(value.id!, participantMapName.get(value.name)!);
  });

  const [bracketMatchId, setBracketMatchId] = useState<number>(-1);
  const [opponent1Id, setOpponent1Id] = useState<number | null>(null);
  const [opponent2Id, setOpponent2Id] = useState<number | null>(null);

  const [canCreateMatch, setCanCreateMatch] = useState(false);

  useEffect(() => {
    if (containerRef.current && window.bracketsViewer && stageData) {
      containerRef.current.innerHTML = "";

      const bracketId = `brackets-container-${stageId}`;
      containerRef.current.id = bracketId;

      try {
        window.bracketsViewer.onMatchClicked = (match) => {
          setBracketMatchId(match.id);
          setOpponent1Id(match.opponent1.id);
          setOpponent2Id(match.opponent2.id);
          setCanCreateMatch(
            match.opponent1.id !== null &&
              match.opponent2.id !== null &&
              !(
                match.opponent1.result !== undefined ||
                match.opponent2.result !== undefined
              )
          );
          onOpenUpdateScoreModal();
        };

        window.bracketsViewer.setParticipantImages(
          stageData.participants.map((p) => ({
            participantId: p.id,
            imageUrl: participantMapName.get(p.name)?.avatar || "",
          }))
        );

        window.bracketsViewer.render(
          {
            stages: stageData.stages,
            matches: stageData.matches,
            matchGames: stageData.matchGames,
            participants: stageData.participants,
          },
          {
            selector: `#${bracketId}`,
            participantOriginPlacement: "before",
            highlightParticipantOnHover: true,
          }
        );
      } catch (error) {
        console.error("Error rendering bracket:", error);
        containerRef.current.innerHTML =
          '<p class="text-danger">Error rendering bracket</p>';
      }
    }
  }, [stageData, stageId]);

  return (
    <>
      <div
        style={{
          minHeight: "400px",
        }}
      >
        <div ref={containerRef} className="brackets-viewer" />
      </div>
      {canCreateMatch && (
        <UpdateScoreModal
          handleGetTournamentById={handleGetTournamentById}
          tournamentId={tournamentId}
          isOpen={isOpenUpdateScoreModal}
          onOpenChange={onOpenUpdateScoreModalChange}
          bracketMatchId={bracketMatchId}
          opponent1Id={opponent1Id!}
          opponent2Id={opponent2Id!}
          deckA={participantMapId.get(opponent1Id!)!}
          deckB={participantMapId.get(opponent2Id!)!}
        />
      )}
    </>
  );
}
