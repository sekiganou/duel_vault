"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDeckById, getDeckStatus, statusColorMap } from "@/lib/api/decks";
import { CardTabItem, DeckWithRelations } from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Image } from "@heroui/image";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import {
  IconCards,
  IconChevronLeft,
  IconGraph,
  IconRefresh,
  IconSword,
  IconSwords,
  IconTrophy,
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

export default function ViewDeckPage() {
  const { id } = useParams();
  const [deck, setDeck] = useState<DeckWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    setLoading(true);
    getDeckById(Number(id))
      .then(setDeck)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (deck) {
      const deckDetailsHeading = document.getElementById(
        "deck-details-heading"
      );
      if (deckDetailsHeading) {
        deckDetailsHeading.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [deck]);

  if (loading) {
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
                onPress={() => window.history.back()}
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

  if (!deck) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Card className="max-w-md">
          <CardBody>
            <p className="text-center">Deck not found</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const totalMatches = deck.wins + deck.losses + deck.ties;
  const winRate =
    totalMatches > 0 ? ((deck.wins / totalMatches) * 100).toFixed(1) : "0";

  // Calculate matchup statistics
  const allMatches = [...deck.matchesA, ...deck.matchesB];
  const matchupStats = new Map<
    string,
    {
      deckId: number;
      wins: number;
      losses: number;
      ties: number;
      avatar: string | null;
      deckName: string;
      archetypeName: string;
    }
  >();

  allMatches.forEach((match) => {
    const opponentDeck = match.deckA.id === deck.id ? match.deckB : match.deckA;
    const key = `${opponentDeck.archetype.name}-${opponentDeck.id}`;

    if (!matchupStats.has(key)) {
      matchupStats.set(key, {
        deckId: opponentDeck.id,
        wins: 0,
        losses: 0,
        ties: 0,
        avatar: opponentDeck.avatar,
        deckName: opponentDeck.name,
        archetypeName: opponentDeck.archetype.name,
      });
    }

    const stats = matchupStats.get(key)!;
    if (match.winnerId === deck.id) {
      stats.wins++;
    } else if (match.winnerId === opponentDeck.id) {
      stats.losses++;
    } else {
      stats.ties++;
    }
  });

  const bestFinish = deck.tournamentStats
    .filter((stat) => stat.position !== null)
    .sort((a, b) => (a.position! < b.position! ? -1 : 1))[0]?.position;

  const totalPodiums = deck.tournamentStats.filter(
    (stat) => stat.position !== null && stat.position <= 3
  ).length;

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-4xl"
      id="deck-details-heading"
    >
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="light"
          onPress={() => window.history.back()}
          isIconOnly
          size={"lg"}
        >
          <IconChevronLeft />
        </Button>
        <h1 className="text-3xl font-bold">Deck Details</h1>
      </div>
      {/* Deck Overview */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-6 w-full">
            {deck.avatar && (
              <div className="flex-shrink-0">
                <Button
                  className="w-full h-full p-0"
                  variant="light"
                  onPress={onOpen}
                >
                  <Image
                    isZoomed
                    src={deck.avatar}
                    alt={`${deck.name} avatar`}
                    radius="lg"
                    className="w-24 h-24"
                  />
                </Button>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{deck.name}</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Chip color="primary" variant="flat" size="md">
                      {deck.format.name}
                    </Chip>
                    <Chip color="secondary" variant="flat" size="md">
                      {deck.archetype.name}
                    </Chip>
                    <Chip
                      color={statusColorMap[getDeckStatus(deck)]}
                      variant="flat"
                      size="md"
                    >
                      {capitalize(getDeckStatus(deck))}
                    </Chip>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <IconCards size={24} />
                </div>
              </div>

              {/* Deck Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-500">Created:</span>
                    <span className="font-semibold text-sm">
                      {new Date(deck.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {deck.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">
                        Last Updated:
                      </span>
                      <span className="font-semibold text-sm">
                        {new Date(deck.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <Divider className="mb-4" />
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Description
            </h3>
            {deck.description ? (
              <p className="text-default-600 leading-relaxed">
                {deck.description}
              </p>
            ) : (
              <p className="text-default-400 italic">
                No description available
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Statistics */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <IconGraph className="text-primary" />
            <h2 className="text-xl font-semibold">Match Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-semibold text-success">{winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Wins:</span>
                <span className="font-semibold text-success">{deck.wins}</span>
              </div>
              <div className="flex justify-between">
                <span>Losses:</span>
                <span className="font-semibold text-danger">{deck.losses}</span>
              </div>
              <div className="flex justify-between">
                <span>Ties:</span>
                <span className="font-semibold text-warning">{deck.ties}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span>Total Matches:</span>
                <span className="font-semibold">{totalMatches}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <IconTrophy className="text-primary" />
            <h2 className="text-xl font-semibold">Tournament Statistics</h2>
          </CardHeader>
          <CardBody>
            {deck.tournamentStats.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Tournaments Played:</span>
                  <span className="font-semibold">
                    {deck.tournamentStats.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Best Finish:</span>
                  <span className="font-semibold">
                    {bestFinish === 1
                      ? "🥇 #1"
                      : bestFinish === 2
                        ? "🥈 #2"
                        : bestFinish === 3
                          ? "🥉 #3"
                          : "🔹#" + bestFinish}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Podiums:</span>
                  <span className="font-semibold">{totalPodiums}</span>
                </div>
              </div>
            ) : (
              <p className="text-default-600 italic">
                No tournament data available
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Divider className="my-8" />

      <CardTabs
        tabs={[
          {
            key: "matchup-statistics",
            title: "Matchups",
            emptyContent: {
              header: "No Matchup Data",
              text: "This deck has not played any matches yet.",
              icon: (props) => <IconSwords {...props} />,
              displayEmptyContent: matchupStats.size === 0,
            },
            cardBody: (
              <Table aria-label="Deck Matchup Statistics">
                <TableHeader>
                  <TableColumn>OPPONENT DECK</TableColumn>
                  <TableColumn>WINS</TableColumn>
                  <TableColumn>LOSSES</TableColumn>
                  <TableColumn>TIES</TableColumn>
                  <TableColumn>WIN RATE</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {Array.from(matchupStats.entries())
                    .sortByWinsAndLosses(
                      (stats) => stats[1].wins,
                      (stats) => stats[1].losses
                    )
                    .map(([key, stats]) => {
                      const total = stats.wins + stats.losses + stats.ties;
                      const winRate =
                        total > 0
                          ? ((stats.wins / total) * 100).toFixed(1)
                          : "0";

                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <User
                              name={stats.deckName}
                              description={stats.archetypeName}
                              avatarProps={{
                                src: stats.avatar || undefined,
                                size: "sm",
                                radius: "lg",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-success font-semibold">
                              {stats.wins}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-danger font-semibold">
                              {stats.losses}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-warning font-semibold">
                              {stats.ties}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={
                                parseFloat(winRate) >= 75
                                  ? "success"
                                  : parseFloat(winRate) >= 50
                                    ? "warning"
                                    : "danger"
                              }
                              variant="flat"
                              size="sm"
                            >
                              {winRate}%
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="light"
                              size="sm"
                              onPress={() =>
                                router.push(`/decks/${stats.deckId}`)
                              }
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
            key: "tournament-performance",
            title: "Tournaments",
            emptyContent: {
              header: "No Tournament Data",
              text: "This deck hasn't participated in any tournaments yet.",
              icon: (props) => <IconTrophy {...props} />,
              displayEmptyContent: deck.tournamentStats.length === 0,
            },
            cardBody: (
              <Table aria-label="Tournament Performance">
                <TableHeader>
                  <TableColumn>TOURNAMENT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>RANK</TableColumn>
                  <TableColumn>WINS</TableColumn>
                  <TableColumn>LOSSES</TableColumn>
                  <TableColumn>TIES</TableColumn>
                  <TableColumn>WIN RATE</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {deck.tournamentStats.map((stat, index) => {
                    const totalGames = stat.wins + stat.losses + stat.ties;
                    const winRate =
                      totalGames > 0
                        ? ((stat.wins / totalGames) * 100).toFixed(1)
                        : "0";

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {stat.tournament?.name || "Unknown Tournament"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-small">
                            {stat.tournament?.startDate
                              ? new Date(
                                  stat.tournament.startDate
                                ).toLocaleDateString()
                              : "Unknown Date"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {stat.position
                              ? stat.position === 1
                                ? "🥇 #1"
                                : stat.position === 2
                                  ? "🥈 #2"
                                  : stat.position === 3
                                    ? "🥉 #" + stat.position
                                    : "🔹#" + stat.position
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-success font-semibold">
                            {stat.wins}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-danger font-semibold">
                            {stat.losses}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-warning font-semibold">
                            {stat.ties}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              parseFloat(winRate) >= 75
                                ? "success"
                                : parseFloat(winRate) >= 50
                                  ? "warning"
                                  : "danger"
                            }
                            variant="flat"
                            size="sm"
                          >
                            {winRate}%
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() =>
                              router.push(`/tournaments/${stat.tournament?.id}`)
                            }
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
            key: "all-matches",
            title: "Matches",
            emptyContent: {
              header: "No Match Data",
              text: "This deck hasn't participated in any matches yet.",
              icon: (props) => <IconSwords {...props} />,
              displayEmptyContent:
                deck.matchesA.length === 0 && deck.matchesB.length === 0,
            },
            cardBody: (
              <Table aria-label="Match Performance">
                <TableHeader>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>OPPONENT DECK</TableColumn>
                  <TableColumn>RESULT</TableColumn>
                  <TableColumn>SCORE</TableColumn>
                  <TableColumn>TOURNAMENT</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {allMatches
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((match) => {
                      const opponentDeck =
                        match.deckA.id === deck.id ? match.deckB : match.deckA;
                      const ownScore =
                        match.deckA.id === deck.id
                          ? match.deckAScore
                          : match.deckBScore;
                      const opponentScore =
                        match.deckA.id === deck.id
                          ? match.deckBScore
                          : match.deckAScore;

                      let result: string;
                      let resultColor: "success" | "danger" | "warning";

                      if (match.winnerId === deck.id) {
                        result = "Win";
                        resultColor = "success";
                      } else if (match.winnerId === opponentDeck.id) {
                        result = "Loss";
                        resultColor = "danger";
                      } else {
                        result = "Tie";
                        resultColor = "warning";
                      }

                      return (
                        <TableRow key={match.id}>
                          <TableCell>
                            <span className="text-small">
                              {new Date(match.date).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <User
                              name={opponentDeck.name}
                              description={opponentDeck.archetype.name}
                              avatarProps={{
                                src: opponentDeck.avatar || undefined,
                                size: "sm",
                                radius: "lg",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip color={resultColor} variant="flat" size="sm">
                              {result}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-small">
                              {ownScore} - {opponentScore}
                            </span>
                          </TableCell>
                          <TableCell>
                            {match.tournament ? (
                              <span className="text-small">
                                {match.tournament.name}
                              </span>
                            ) : (
                              <span className="text-small text-default-400">
                                Friendly
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="light"
                              size="sm"
                              onPress={() =>
                                router.push(`/matches/${match.id}`)
                              }
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
        ]}
      />

      {/* Image Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{deck?.name}</h2>
                <p className="text-sm text-default-500">Deck Avatar</p>
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="flex justify-center">
                  <Image
                    src={deck?.avatar || ""}
                    alt={`${deck?.name} avatar`}
                    radius="lg"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
