import { upsertMatch } from "@/lib/api/matches";
import { DeckWithRelations } from "@/types";
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
import { useEffect, useRef, useState } from "react";

const UpdateScoreModal = ({
  isOpen,
  onOpenChange,
  bracketMatchId,
  opponent1Id,
  opponent2Id,
  tournamentId,
  deckA,
  deckB,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  opponent1Id: number;
  opponent2Id: number;
  tournamentId: number;
  bracketMatchId: number;
  deckA: DeckWithRelations;
  deckB: DeckWithRelations;
}) => {
  const [winnerId, setWinnerId] = useState<string>("");
  const [deckAScore, setDeckAScore] = useState("");
  const [deckBScore, setDeckBScore] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [loadingCreateMatch, setLoadingCreateMatch] = useState(false);

  console.log("winnerId:", winnerId);

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
        onOpenChange(false);
      })
      .finally(() => {
        setLoadingCreateMatch(false);
      });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {"Create Match"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
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
                        {deckA.archetype.name}
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
                        {deckB.archetype.name}
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
                          ? String(deckB.name)
                          : String(deckA.name)
                    );
                  }}
                  min="0"
                  isRequired
                />

                <div className="md:col-span-2">
                  <label className="text-small font-medium mb-2 block">
                    Winner (Optional)
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setWinnerId(String(deckA.id))}
                      className={`flex-1 p-3 border rounded-lg transition-colors ${
                        winnerId === String(deckA.id)
                          ? "border-primary bg-primary/10"
                          : "border-default-300 bg-default-50 hover:bg-default-100"
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        <Avatar
                          alt={deckA.name}
                          className="shrink-0"
                          size="sm"
                          src={deckA.avatar ?? ""}
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-small font-medium">
                            {deckA?.name}
                          </span>
                          <span className="text-tiny text-default-400">
                            {deckA?.archetype.name}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWinnerId(String(deckB.id))}
                      className={`flex-1 p-3 border rounded-lg transition-colors ${
                        winnerId === String(deckB.id)
                          ? "border-primary bg-primary/10"
                          : "border-default-300 bg-default-50 hover:bg-default-100"
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        <Avatar
                          alt={deckB.name}
                          className="shrink-0"
                          size="sm"
                          src={deckB?.avatar ?? ""}
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-small font-medium">
                            {deckB?.name}
                          </span>
                          <span className="text-tiny text-default-400">
                            {deckB?.archetype.name}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWinnerId("")}
                      className={`px-4 py-3 border rounded-lg transition-colors ${
                        winnerId === ""
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-default-300 bg-default-50 hover:bg-default-100 text-default-600"
                      }`}
                    >
                      Tie
                    </button>
                  </div>
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
                isDisabled={!(deckAScore && deckBScore)}
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
}: {
  tournamentId: number;
  stageData: {
    stages: any[];
    matches: any[];
    matchGames: any[];
    participants: any[];
  };
  stageId: number;
  participantMapName: Map<string, DeckWithRelations>;
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

  console.log("participantMapId: ", participantMapId);

  const [bracketMatchId, setBracketMatchId] = useState<number>(-1);
  const [opponent1Id, setOpponent1Id] = useState<number>(-1);
  const [opponent2Id, setOpponent2Id] = useState<number>(-1);

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
          onOpenUpdateScoreModalChange();
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

  console.log("bracketMatchId: ", bracketMatchId);
  console.log("stageData.matches: ", stageData.matches);

  console.log("opponent 1 ", opponent1Id);
  console.log("opponent 2 ", opponent2Id);

  return (
    <>
      <div ref={containerRef} className="brackets-viewer" />;
      <UpdateScoreModal
        tournamentId={tournamentId}
        isOpen={isOpenUpdateScoreModal}
        onOpenChange={onOpenUpdateScoreModalChange}
        bracketMatchId={bracketMatchId!}
        opponent1Id={opponent1Id}
        opponent2Id={opponent2Id}
        deckA={participantMapId.get(opponent1Id)!}
        deckB={participantMapId.get(opponent2Id)!}
      />
    </>
  );
}
