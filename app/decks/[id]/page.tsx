"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDeckById, getDeckStatus, statusColorMap } from "@/lib/api/decks";
import { CardTabItem, DeckWithRelations } from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Image } from "@heroui/image";
import {
  IconChevronLeft,
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
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tab, Tabs } from "@heroui/tabs";
import { useTheme } from "next-themes";
import { CardTabs } from "@/components/cardTabs";
import { CustomScrollShadow } from "@/components/customScrollShadow";

export default function ViewDeckPage() {
  const { id } = useParams();
  const [deck, setDeck] = useState<DeckWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDeckById(Number(id))
      .then(setDeck)
      .finally(() => setLoading(false));
  }, [id]);

  console.log("Deck data:", deck);

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

  const tabs: CardTabItem[] = [
    {
      key: "matchup-statistics",
      title: "Matchup Statistics",
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
                  total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0";

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
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      ),
    },
    {
      key: "tournament-performance",
      title: "Tournament Performance",
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
            <TableColumn>WINS</TableColumn>
            <TableColumn>LOSSES</TableColumn>
            <TableColumn>TIES</TableColumn>
            <TableColumn>WIN RATE</TableColumn>
          </TableHeader>
          <TableBody>
            {deck.tournamentStats
              .sort(
                (a, b) =>
                  new Date(b.tournament?.startDate || 0).getTime() -
                  new Date(a.tournament?.startDate || 0).getTime()
              )
              .map((stat, index) => {
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
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      ),
    },
  ];

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
        <CardHeader className="pb-0">
          <div className="flex items-center gap-4 w-full">
            {deck.avatar && (
              <Image
                src={deck.avatar}
                alt={`${deck.name} avatar`}
                radius="lg"
                className="w-20 h-20 text-large"
                // className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{deck.name}</h2>
              <div className="flex gap-2 mt-2 flex-col md:flex-row">
                <Chip color="primary" variant="flat">
                  {deck.format.name}
                </Chip>
                <Chip color="secondary" variant="flat">
                  {deck.archetype.name}
                </Chip>
                <Chip
                  color={statusColorMap[getDeckStatus(deck)]}
                  variant="flat"
                >
                  {capitalize(getDeckStatus(deck))}
                </Chip>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Divider className="my-4" />
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          {deck.description ? (
            <p className="text-default-600">{deck.description}</p>
          ) : (
            <p className="text-default-600 italic">No description available</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Statistics */}
        <Card>
          <CardHeader>
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

        {/* Deck Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Deck Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-semibold">{deck.format.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Archetype:</span>
                <span className="font-semibold">{deck.archetype.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-semibold">
                  {new Date(deck.createdAt).toLocaleDateString()}
                </span>
              </div>
              {deck.updatedAt && (
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-semibold">
                    {new Date(deck.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Divider className="my-8" />

      <CardTabs tabs={tabs} />
    </div>
  );
}
