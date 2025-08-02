"use client";

import { Link } from "@heroui/link";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { Button } from "@heroui/button";
import { useEffect, useState } from "react";
import { getAllDecks } from "@/lib/api/decks";
import { getAllMatches } from "@/lib/api/matches";
import { Deck, MatchWithRelations } from "@/types";
import {
  IconTrophy,
  IconCards,
  IconSwords,
  IconCalendar,
  IconTrendingUp,
  IconEye,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { Skeleton } from "@heroui/skeleton";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [matches, setMatches] = useState<MatchWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [decksData, matchesData] = await Promise.all([
          getAllDecks(),
          getAllMatches(),
        ]);
        setDecks(decksData);
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const totalDecks = decks.length;
  const activeDecks = decks.filter((deck) => deck.active).length;
  const totalMatches = matches.length;
  const recentMatches = matches.slice(0, 5);

  const totalWins = decks.reduce((sum, deck) => sum + deck.wins, 0);
  const totalLosses = decks.reduce((sum, deck) => sum + deck.losses, 0);
  const totalTies = decks.reduce((sum, deck) => sum + deck.ties, 0);
  const winRate =
    totalWins + totalLosses + totalTies > 0
      ? Math.round((totalWins / (totalWins + totalLosses + totalTies)) * 100)
      : 0;

  // Get top performing deck
  const topDeck = decks.reduce((best, deck) => {
    const bestWinRate =
      best.wins + best.losses + best.ties > 0
        ? best.wins / (best.wins + best.losses + best.ties)
        : 0;
    const deckWinRate =
      deck.wins + deck.losses + deck.ties > 0
        ? deck.wins / (deck.wins + deck.losses + deck.ties)
        : 0;
    return deckWinRate > bestWinRate ? deck : best;
  }, decks[0]);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMatchResult = (match: MatchWithRelations, deck: Deck) => {
    if (!match.winnerId) return "tie";
    if (match.winnerId === deck.id) return "win";
    return "loss";
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return "success";
      case "loss":
        return "danger";
      case "tie":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <Skeleton className="w-[50%] h-16 mb-4 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="w-full h-16 mb-4 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="w-full h-64 mb-4 rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="flex flex-col gap-6 py-8 md:py-10 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Duel Vault Dashboard</h1>
        <p className="text-lg text-default-600">
          Track your deck performance and match history
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-100">
              <IconCards className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDecks}</p>
              <p className="text-small text-default-500">Total Decks</p>
              <p className="text-tiny text-success">{activeDecks} active</p>
            </div>
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary-200">
              <IconSwords className="text-secondary-700" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMatches}</p>
              <p className="text-small text-default-500">Total Matches</p>
            </div>
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-success-100">
              <IconTrophy className="text-success" size={24} />
            </div>
            {/* <div>
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-small text-default-500">Win Rate</p>
              <p className="text-tiny text-default-400">
                {totalWins}W {totalLosses}L {totalTies}T
              </p>
            </div> */}
            <div>
              <p className="text-2xl font-bold">{0}</p>
              <p className="text-small text-default-500">Total Tournaments</p>
            </div>
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-warning-100">
              <IconTrendingUp className="text-warning" size={24} />
            </div>
            <div>
              <p className="text-large font-bold">{topDeck?.name || "None"}</p>
              <p className="text-small text-default-500">Top Deck</p>
              {topDeck && (
                <p className="text-tiny text-default-400">
                  {Math.round(
                    (topDeck.wins /
                      (topDeck.wins + topDeck.losses + topDeck.ties || 1)) *
                      100
                  )}
                  % WR
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalendar size={20} />
              <h3 className="text-lg font-semibold">Recent Matches</h3>
            </div>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push("/matches")}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody className="gap-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-default-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-small">
                      <p className="font-medium">
                        {match.deckA.name} vs {match.deckB.name}
                      </p>
                      <p className="text-tiny text-default-400">
                        {formatDate(match.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getResultColor(
                        match.winnerId === match.deckA.id
                          ? "win"
                          : match.winnerId === match.deckB.id
                            ? "loss"
                            : "tie"
                      )}
                    >
                      {match.deckAScore}-{match.deckBScore}
                    </Chip>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-default-400 text-center py-4">
                No matches yet
              </p>
            )}
          </CardBody>
        </Card>

        {/* Top Decks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <IconTrophy size={20} />
              <h3 className="text-lg font-semibold">Top Performing Decks</h3>
            </div>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push("/decks")}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody className="gap-3">
            {decks
              .filter((deck) => deck.wins + deck.losses + deck.ties > 0)
              .sort((a, b) => {
                const aRate = a.wins / (a.wins + a.losses + a.ties);
                const bRate = b.wins / (b.wins + b.losses + b.ties);
                return bRate - aRate;
              })
              .slice(0, 5)
              .map((deck) => {
                const deckWinRate = Math.round(
                  (deck.wins / (deck.wins + deck.losses + deck.ties)) * 100
                );
                return (
                  <Button
                    key={deck.id}
                    onPress={() => router.push(`/decks/${deck.id}`)}
                    className="flex items-center justify-between p-3"
                    // radius="md"
                    variant="light"
                  >
                    <User
                      avatarProps={{
                        radius: "sm",
                        src: deck.avatar || undefined,
                        showFallback: true,
                        size: "sm",
                      }}
                      name={deck.name}
                      description={deck.archetype.name}
                      classNames={{
                        name: "text-small font-medium",
                        description: "text-tiny",
                      }}
                    />
                    <div className="text-right">
                      <p className="text-small font-bold text-success">
                        {deckWinRate}%
                      </p>
                      <p className="text-tiny text-default-400">
                        {deck.wins}W {deck.losses}L {deck.ties}T
                      </p>
                    </div>
                  </Button>
                );
              })}
            {decks.filter((deck) => deck.wins + deck.losses + deck.ties > 0)
              .length === 0 && (
              <p className="text-default-400 text-center py-4">
                No match data available
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<IconCards size={18} />}
              onPress={() => router.push("/decks")}
            >
              Manage Decks
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<IconSwords size={18} />}
              onPress={() => router.push("/matches")}
            >
              Record Match
            </Button>
            {topDeck && (
              <Button
                color="success"
                variant="flat"
                startContent={<IconEye size={18} />}
                onPress={() => router.push(`/decks/${topDeck.id}`)}
              >
                View Top Deck
              </Button>
            )}
          </div>
        </CardBody>
      </Card> */}
    </section>
  );
}
