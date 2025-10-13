"use client";

import { useParams, useRouter } from "next/navigation";

// Declare window.bracketsViewer for TypeScript
declare global {
  interface Window {
    bracketsViewer?: {
      setParticipantImages: (
        participants: { participantId: number; imageUrl: string }[]
      ) => void;
      onMatchClicked: (match: any) => void;
      render: (
        data: {
          stages: any[];
          matches: any[];
          matchGames: any[];
          participants: any[];
        },
        options?: {
          selector?: string;
          [key: string]: any;
        }
      ) => string | void;
    };
  }
}
import { Image } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { getTournamentById, updateTournament } from "@/lib/api/tournaments";
import {
  CardTabItem,
  DeckWithRelations,
  GrandFinalType,
  TournamentType,
  TournamentWithRelations,
} from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip, ChipProps } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import {
  IconChevronLeft,
  IconRefresh,
  IconCalendar,
  IconLink,
  IconTrophy,
  IconSwords,
  IconGraph,
  IconEye,
  IconLock,
  IconCheck,
  IconUser,
} from "@tabler/icons-react";
import { Button } from "@heroui/button";
import { capitalize } from "@/components/fullTable";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { User } from "@heroui/user";
import "@/lib/extensions/array";
import { CardTabs } from "@/components/cardTabs";
import { Deck, TournamentStatus } from "@/generated/prisma";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { upsertMatch } from "@/lib/api/matches";
import { BracketViewer } from "./BracketViewer";
import { Progress } from "@heroui/progress";
import { Tooltip } from "@heroui/tooltip";

const statusColorMap: Record<string, ChipProps["color"]> = {
  UPCOMING: "primary",
  ONGOING: "success",
  COMPLETED: "default",
};

const participantMapName = new Map<string, DeckWithRelations>();

export default function ViewTournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<TournamentWithRelations | null>(
    null
  );

  const {
    isOpen: isOpenCompleteModal,
    onOpen: onOpenCompleteModal,
    onOpenChange: onOpenCompleteModalChange,
  } = useDisclosure();

  const [loadingTournament, setLoadingTournament] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleGetTournamentById = () => {
    getTournamentById(Number(id))
      .then((tournament) => {
        setTournament(tournament);
        participantMapName.clear();
        tournament.deckStats.forEach((deckStat) => {
          participantMapName.set(deckStat.deck.name, deckStat.deck);
        });
      })
      .catch((err) => {
        setError(err.message || "Failed to load tournament");
      })
      .finally(() => setLoadingTournament(false));
  };

  useEffect(() => {
    setLoadingTournament(true);
    setError(null);
    handleGetTournamentById();
  }, [id]);

  useEffect(() => {
    if (tournament) {
      const tournamentDetailsHeading = document.getElementById(
        "tournament-details-heading"
      );
      if (tournamentDetailsHeading) {
        tournamentDetailsHeading.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [id]);

  if (loadingTournament) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Card className="max-w-md">
          <CardBody className="text-center py-4">
            <p className="text-center text-danger">Error: "{error}"</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="light"
                onPress={() => router.back()}
                startContent={<IconChevronLeft />}
              >
                Go Back
              </Button>
              <Button
                variant="light"
                onPress={() => window.location.reload()}
                startContent={<IconRefresh />}
              >
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Card className="max-w-md">
          <CardBody>
            <p className="text-center">Tournament not found</p>
            <div className="flex justify-center mt-4">
              <Button
                variant="light"
                onPress={() => router.back()}
                startContent={<IconChevronLeft />}
              >
                Go Back
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const status = tournament.status;
  const totalMatches =
    tournament.stages[0].data.matches.length -
    (tournament.stages[0].data.stages[0].settings.grandFinal ===
    GrandFinalType.DOUBLE
      ? 1
      : 0);
  const matchesPlayed = tournament.matches.length;

  // Calculate tournament duration
  const startDate = new Date(tournament.startDate);
  const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
  const now = new Date();

  let durationText = "";
  if (status === TournamentStatus.UPCOMING) {
    const daysUntilStart = Math.ceil(
      (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`;
  } else if (status === TournamentStatus.ONGOING) {
    const daysSinceStart = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Running for ${daysSinceStart} day${daysSinceStart !== 1 ? "s" : ""}`;
  } else if (status === TournamentStatus.COMPLETED && endDate) {
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Duration: ${duration} day${duration !== 1 ? "s" : ""}`;
  }

  const canComplete = matchesPlayed >= totalMatches;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <IconChevronLeft />
        </Button>
        <div className="flex-1" id="tournament-details-heading">
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Chip color={statusColorMap[status]} size="sm" variant="flat">
              {capitalize(status)}
            </Chip>
            <span className="text-small text-default-500">
              {tournament.format.name}
            </span>
          </div>
        </div>
        {status !== TournamentStatus.COMPLETED && (
          <Tooltip
            content={
              canComplete
                ? "Complete Tournament"
                : "Complete option will be available once all matches are played"
            }
          >
            <Button
              variant="solid"
              color={canComplete ? "primary" : "default"}
              onPress={() => onOpenCompleteModal()}
              startContent={canComplete ? <IconCheck /> : <IconLock />}
              disabled={!canComplete}
            >
              Complete
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Tournament Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex gap-3">
            <IconTrophy className="text-primary" size={24} />
            <div className="flex flex-col">
              <p className="text-md font-semibold">Tournament Information</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <IconCalendar size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Start Date</p>
                  <p className="text-small font-medium">
                    {startDate.toLocaleDateString()} at{" "}
                    {startDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconSwords size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Total Matches</p>
                  <p className="text-small font-medium">{totalMatches}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconCalendar size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">End Date</p>
                  {endDate ? (
                    <p className="text-small font-medium">
                      {endDate.toLocaleDateString()} at{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : (
                    <p className="text-small font-medium">N/A</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconUser size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Participants</p>
                  <p className="text-small font-medium">
                    {tournament.deckStats.length}
                  </p>
                </div>
              </div>

              {durationText && (
                <div className="flex items-center gap-3">
                  <IconCalendar size={20} className="text-default-400" />
                  <div>
                    <p className="text-small text-default-500">Duration</p>
                    <p className="text-small font-medium">{durationText}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <IconGraph size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Format</p>
                  <p className="text-small font-medium">
                    {tournament.format.name}
                  </p>
                </div>
              </div>
            </div>

            {tournament.link && (
              <div className="pt-2">
                <a
                  href={tournament.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <IconLink size={16} />
                  <span className="text-small">External Tournament Link</span>
                </a>
              </div>
            )}

            {tournament.notes && (
              <div className="pt-2">
                <p className="text-small text-default-500 mb-1">Notes</p>
                <p className="text-small">{tournament.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Tournament Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconGraph className="text-primary" size={24} />
              <p className="text-md font-semibold">Tournament Statistics</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between">
              <span className="text-small text-default-500">Status</span>
              <Chip color={statusColorMap[status]} size="sm" variant="flat">
                {capitalize(status)}
              </Chip>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-small text-default-500">Progress</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={(matchesPlayed / totalMatches) * 100}
                  className="w-32"
                  size="sm"
                />
                <span className="text-small font-medium">
                  {matchesPlayed}/{totalMatches} Matches
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isOpenCompleteModal}
        onOpenChange={onOpenCompleteModalChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Complete Tournament</ModalHeader>
              <ModalBody>
                <p className="mb-4">
                  Are you sure you want to mark this tournament as completed?
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter className="space-x-2">
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  isLoading={loadingComplete}
                  onPress={async () => {
                    setLoadingComplete(true);
                    await updateTournament({
                      id: tournament.id.toString(),
                      name: tournament.name,
                      startDate: new Date(tournament.startDate).toISOString(),
                      endDate: new Date().toISOString(),
                      status: TournamentStatus.COMPLETED,
                    });
                    onClose();
                    handleGetTournamentById();
                    setLoadingComplete(false);
                  }}
                >
                  Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {status === TournamentStatus.COMPLETED && (
        <>
          <Divider className="my-8" />

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <IconTrophy className="text-primary" size={28} />
            Final Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {tournament.deckStats.slice(0, 3).map((deckStat, index) => {
              const position = index + 1;
              const totalGames =
                deckStat.wins + deckStat.losses + deckStat.ties;
              const winRate =
                totalGames > 0
                  ? ((deckStat.wins / totalGames) * 100).toFixed(1)
                  : "0";

              // Podium colors and styling
              const podiumConfig = {
                1: {
                  emoji: "🥇",
                  title: "1st Place",
                  chipColor: "warning" as ChipProps["color"], // Gold
                  cardBorder: "border-yellow-500",
                  headerBg:
                    "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20",
                },
                2: {
                  emoji: "🥈",
                  title: "2nd Place",
                  chipColor: "default" as ChipProps["color"], // Silver
                  cardBorder: "border-gray-400",
                  headerBg:
                    "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20",
                },
                3: {
                  emoji: "🥉",
                  title: "3rd Place",
                  chipColor: "secondary" as ChipProps["color"], // Bronze
                  cardBorder: "border-orange-600",
                  headerBg:
                    "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20",
                },
              }[position];

              return (
                <Card
                  key={deckStat.id}
                  className={`${podiumConfig?.cardBorder} border-2`}
                >
                  <CardHeader
                    className={`${podiumConfig?.headerBg} rounded-t-lg`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{podiumConfig?.emoji}</span>
                        <div>
                          <p className="text-lg font-bold">
                            {podiumConfig?.title}
                          </p>
                          <Chip
                            color={podiumConfig?.chipColor}
                            size="sm"
                            variant="flat"
                            className="font-semibold"
                          >
                            {deckStat.wins}W - {deckStat.losses}L -{" "}
                            {deckStat.ties}T
                          </Chip>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-small text-default-500">Win Rate</p>
                        <p className="text-lg font-bold">{winRate}%</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="text-center space-y-4">
                    <div className="flex justify-center w-full">
                      <Button
                        className="h-full p-4"
                        variant="light"
                        onPress={() => router.push(`/decks/${deckStat.deckId}`)}
                      >
                        <Avatar
                          src={deckStat.deck.avatar || undefined}
                          className="w-32 h-32 text-large"
                          radius="lg"
                        />
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {deckStat.deck.name}
                      </h3>
                      <p className="text-default-500 mb-2">
                        {deckStat.deck.archetype.name}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Divider className="my-8" />

      <CardTabs
        tabs={[
          {
            title: "Standings",
            key: "standings",
            emptyContent: {
              header: "No Standings Available",
              text: "This tournament has no standings yet.",
              icon: (props) => <IconTrophy {...props} />,
              displayEmptyContent: tournament.deckStats.length === 0,
            },
            cardBody: (
              <Table aria-label="Tournament Standings">
                <TableHeader>
                  <TableColumn>RANK</TableColumn>
                  <TableColumn>DECK</TableColumn>
                  <TableColumn>ARCHETYPE</TableColumn>
                  <TableColumn>WINS</TableColumn>
                  <TableColumn>LOSSES</TableColumn>
                  <TableColumn>TIES</TableColumn>
                  <TableColumn>WIN RATE</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {tournament.deckStats.map((deckStat, index) => {
                    const totalGames =
                      deckStat.wins + deckStat.losses + deckStat.ties;
                    const winRate =
                      totalGames > 0
                        ? ((deckStat.wins / totalGames) * 100).toFixed(1)
                        : "0";
                    const finalRank = index + 1;

                    return (
                      <TableRow key={deckStat.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {finalRank === 1 && (
                              <span className="text-yellow-500">🥇</span>
                            )}
                            {finalRank === 2 && (
                              <span className="text-gray-400">🥈</span>
                            )}
                            {finalRank === 3 && (
                              <span className="text-orange-600">🥉</span>
                            )}
                            {finalRank > 3 && (
                              <span className="text-default-400">🔹</span>
                            )}
                            <span className="font-semibold">#{finalRank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <User
                            name={deckStat.deck.name}
                            // description={deckStat.deck.format.name}
                            avatarProps={{
                              src: deckStat.deck.avatar || undefined,
                              size: "sm",
                              radius: "lg",
                            }}
                            // className="text-default-400"
                          />
                        </TableCell>
                        <TableCell className="text-default-400">
                          {deckStat.deck.archetype.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-success font-semibold">
                            {deckStat.wins}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-danger font-semibold">
                            {deckStat.losses}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-warning font-semibold">
                            {deckStat.ties}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{winRate}%</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() =>
                              router.push(`/decks/${deckStat.deckId}`)
                            }
                            aria-label={`View deck ${deckStat.deck.name}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ),
          },
          {
            title: "Matches",
            key: "matches",
            emptyContent: {
              header: "No Matches Played",
              text: "This tournament has no matches yet.",
              icon: (props) => <IconSwords {...props} />,
              displayEmptyContent: tournament.matches.length === 0,
            },
            cardBody: (
              <Table aria-label="Tournament Matches">
                <TableHeader>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>DECK A</TableColumn>
                  <TableColumn>DECK B</TableColumn>
                  <TableColumn>SCORE</TableColumn>
                  <TableColumn>WINNER</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {tournament.matches
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          <span className="text-small">
                            {new Date(match.date).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <User
                            name={match.deckA.name}
                            description={match.deckA.archetype.name}
                            className="shrink-0"
                            avatarProps={{
                              src: match.deckA.avatar || undefined,
                              size: "sm",
                              radius: "lg",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <User
                            name={match.deckB.name}
                            description={match.deckB.archetype.name}
                            className="shrink-0"
                            avatarProps={{
                              src: match.deckB.avatar || undefined,
                              size: "sm",
                              radius: "lg",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {match.deckAScore} - {match.deckBScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          {match.winner ? (
                            match.winner.id === match.deckA.id ? (
                              <span className="text-success font-semibold">
                                {match.deckA.name}
                              </span>
                            ) : (
                              <span className="text-danger font-semibold">
                                {match.deckB.name}
                              </span>
                            )
                          ) : (
                            <span className="text-warning font-semibold">
                              Tie
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            // isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => router.push(`/matches/${match.id}`)}
                            aria-label={`View match ${match.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ),
          },
          {
            title: "Bracket",
            key: "bracket",
            emptyContent: {
              header: "No Bracket Available",
              text: "This tournament has no bracket yet.",
              icon: (props) => <IconEye {...props} />,
              displayEmptyContent:
                !tournament.stages || tournament.stages.length === 0,
            },
            cardBody:
              tournament.stages && tournament.stages.length > 0 ? (
                <div>
                  {tournament.stages.map((stage, index) => {
                    if (!stage.fileKey) return null;

                    return (
                      <div key={index}>
                        <BracketViewer
                          handleGetTournamentById={handleGetTournamentById}
                          tournamentId={tournament.id}
                          participantMapName={participantMapName}
                          stageData={stage.data}
                          stageId={stage.id}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-small text-default-500">
                  No bracket data available for this tournament.
                </p>
              ),
          },
        ]}
      />
    </div>
  );
}
