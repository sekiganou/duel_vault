"use client";

import {
  getMatchById,
  getMatchStatus,
  statusColorMap,
  getAllMatches,
  getMatchesByDeckId,
} from "@/lib/api/matches";
import { MatchWithRelations } from "@/types";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { User } from "@heroui/user";
import { Image } from "@heroui/image";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  IconChevronLeft,
  IconRefresh,
  IconSwords,
  IconCalendar,
  IconTrophy,
  IconNotes,
  IconFlag,
  IconClock,
  IconHistory,
  IconGraph,
} from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { capitalize } from "@/components/fullTable";
import Link from "next/link";

export default function ViewMatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<MatchWithRelations | null>(null);
  const [historicalMatches, setHistoricalMatches] = useState<
    MatchWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMatchById(Number(id))
      .then(setMatch)
      .catch((err) => {
        setError(err.message || "Failed to load match");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (match) {
      // Fetch all matches to calculate historical data between these two decks
      getMatchesByDeckId(match.deckA.id, match.deckB.id)
        .then(setHistoricalMatches)
        .catch(console.error);

      const matchDetailsHeading = document.getElementById(
        "match-details-heading"
      );
      if (matchDetailsHeading) {
        matchDetailsHeading.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [match]);

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

  if (!match) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Card className="max-w-md">
          <CardBody>
            <p className="text-center">Match not found</p>
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

  const status = getMatchStatus(match);
  const matchDate = new Date(match.date);
  const winner = match.winner;
  const isWinnerA = winner?.id === match.deckA.id;
  const isWinnerB = winner?.id === match.deckB.id;
  const isDraw = !winner;
  const iconColor = status === "friendly" ? "text-secondary" : "text-primary";
  // Calculate historical matchup statistics
  const calculateHistoricalStats = () => {
    if (historicalMatches.length === 0) {
      return {
        deckAWins: 0,
        deckBWins: 0,
        draws: 0,
        totalHistoricalMatches: 0,
        deckAWinRate: "0",
        deckBWinRate: "0",
        lastMatchDate: 0,
        averageScore: { deckA: 0, deckB: 0 },
      };
    }

    let deckAWins = 0;
    let deckBWins = 0;
    let draws = 0;
    let totalDeckAScore = 0;
    let totalDeckBScore = 0;
    let lastMatchDate: Date | null = null;

    historicalMatches.forEach((historicalMatch) => {
      const historicalDate = new Date(historicalMatch.date);
      if (!lastMatchDate || historicalDate > lastMatchDate) {
        lastMatchDate = historicalDate;
      }

      // Determine which deck is which in the historical match
      const isCurrentDeckAInHistorical =
        historicalMatch.deckA.id === match.deckA.id;
      const currentDeckAScore = isCurrentDeckAInHistorical
        ? historicalMatch.deckAScore
        : historicalMatch.deckBScore;
      const currentDeckBScore = isCurrentDeckAInHistorical
        ? historicalMatch.deckBScore
        : historicalMatch.deckAScore;

      totalDeckAScore += currentDeckAScore;
      totalDeckBScore += currentDeckBScore;

      if (!historicalMatch.winner) {
        draws++;
      } else if (historicalMatch.winner.id === match.deckA.id) {
        deckAWins++;
      } else if (historicalMatch.winner.id === match.deckB.id) {
        deckBWins++;
      }
    });

    const totalHistoricalMatches = historicalMatches.length;
    const deckAWinRate =
      totalHistoricalMatches > 0
        ? ((deckAWins / totalHistoricalMatches) * 100).toFixed(1)
        : "0";
    const deckBWinRate =
      totalHistoricalMatches > 0
        ? ((deckBWins / totalHistoricalMatches) * 100).toFixed(1)
        : "0";

    return {
      deckAWins,
      deckBWins,
      draws,
      totalHistoricalMatches,
      deckAWinRate,
      deckBWinRate,
      lastMatchDate,
      averageScore: {
        deckA:
          totalHistoricalMatches > 0
            ? (totalDeckAScore / totalHistoricalMatches).toFixed(1)
            : "0",
        deckB:
          totalHistoricalMatches > 0
            ? (totalDeckBScore / totalHistoricalMatches).toFixed(1)
            : "0",
      },
    };
  };

  const historicalStats = calculateHistoricalStats();

  // Determine result colors and messages
  const getResultChip = () => {
    if (isDraw) {
      return (
        <Chip color="warning" variant="flat" size="lg">
          Draw
        </Chip>
      );
    }
    return (
      <Chip color={isWinnerA ? "success" : "danger"} variant="flat" size="lg">
        {winner?.name} Wins
      </Chip>
    );
  };

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-6xl"
      id="match-details-heading"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="light"
          onPress={() => router.back()}
          isIconOnly
          size="lg"
        >
          <IconChevronLeft />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Match Details</h1>
          <div className="flex items-center gap-2 mt-1">
            <Chip color={statusColorMap[status]} size="sm" variant="flat">
              {capitalize(status)} Match
            </Chip>
            {match.tournament && (
              <Link
                href={`/tournaments/${match.tournament.id}`}
                className="text-primary hover:underline text-small"
              >
                {match.tournament.name}
              </Link>
            )}
            <span className="text-small text-default-500">
              {match.deckA.format.name}
            </span>
          </div>
        </div>
      </div>

      {/* Match Result Header */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center gap-4 mb-4">
              <IconSwords size={32} className={iconColor} />
            </div>
            {getResultChip()}
            <div className="text-4xl font-bold font-mono mt-4">
              {match.deckAScore} - {match.deckBScore}
            </div>
          </div>

          {/* Deck Matchup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Deck A */}
            <div className="flex flex-col items-center">
              <Button
                variant="light"
                className="p-4 h-auto"
                onPress={() => router.push(`/decks/${match.deckA.id}`)}
              >
                <User
                  name={match.deckA.name}
                  description={`${match.deckA.archetype.name}`}
                  avatarProps={{
                    src: match.deckA.avatar || undefined,
                    size: "lg",
                    radius: "lg",
                  }}
                  className="justify-center"
                />
              </Button>
              {isWinnerA && (
                <Chip color="success" variant="flat" size="sm" className="mt-2">
                  Winner
                </Chip>
              )}
            </div>

            {/* VS */}
            <div className="flex justify-center">
              <div className="text-2xl font-bold text-default-400">VS</div>
            </div>

            {/* Deck B */}
            <div className="flex flex-col items-center">
              <Button
                variant="light"
                className="p-4 h-auto"
                onPress={() => router.push(`/decks/${match.deckB.id}`)}
              >
                <User
                  name={match.deckB.name}
                  description={`${match.deckB.archetype.name}`}
                  avatarProps={{
                    src: match.deckB.avatar || undefined,
                    size: "lg",
                    radius: "lg",
                  }}
                  className="justify-center"
                />
              </Button>
              {isWinnerB && (
                <Chip color="danger" variant="flat" size="sm" className="mt-2">
                  Winner
                </Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Match Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Match Details */}
        <Card>
          <CardHeader className="flex gap-3">
            <IconSwords className={iconColor} size={24} />
            <div className="flex flex-col">
              <p className="text-md font-semibold">Match Information</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <IconClock size={20} className="text-default-400" />
              <div>
                <p className="text-small text-default-500">Date & Time</p>
                <p className="text-small font-medium">
                  {matchDate.toLocaleDateString()} at{" "}
                  {matchDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <IconFlag size={20} className="text-default-400" />
              <div>
                <p className="text-small text-default-500">Match Type</p>
                <p className="text-small font-medium">
                  {capitalize(status)} Match
                </p>
              </div>
            </div>

            {match.tournament && (
              <div className="flex items-center gap-3">
                <IconTrophy size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Tournament</p>
                  <Link
                    href={`/tournaments/${match.tournament.id}`}
                    className="text-small font-medium text-primary hover:underline"
                  >
                    {match.tournament.name}
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <IconSwords size={20} className="text-default-400" />
              <div>
                <p className="text-small text-default-500">Final Score</p>
                <p className="text-small font-medium font-mono">
                  {match.deckAScore} - {match.deckBScore}
                </p>
              </div>
            </div>

            {match.notes && (
              <div className="flex items-center gap-3">
                <IconNotes size={20} className="text-default-400 shrink-0" />
                <div>
                  <p className="text-small text-default-500">Notes</p>
                  <p className="text-small italic">{match.notes}</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Match Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconGraph className={iconColor} />
              <p className="text-md font-semibold">Match Statistics</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-small text-default-500">
                  {match.deckA.name} Score
                </span>
                <span className="text-small font-medium font-mono">
                  {match.deckAScore}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-small text-default-500">
                  {match.deckB.name} Score
                </span>
                <span className="text-small font-medium font-mono">
                  {match.deckBScore}
                </span>
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <span className="text-small text-default-500">Result</span>
                <span className="text-small font-medium">
                  {isDraw ? "Draw" : `${winner?.name} Victory`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-small text-default-500">Format</span>
                <span className="text-small font-medium">
                  {match.deckA.format.name}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Historical Matchup Statistics */}
      <Card className="mb-6">
        <CardHeader className="flex gap-3">
          <IconHistory className={iconColor} size={24} />
          <div className="flex flex-col">
            <p className="text-md font-semibold">Historical Matchup</p>
            <p className="text-small text-default-500">
              {match.deckA.name} vs {match.deckB.name}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {historicalStats.totalHistoricalMatches === 0 ? (
            <div className="text-center py-8">
              <p className="text-default-500">
                No previous matches between these decks
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {historicalStats.deckAWins}
                  </div>
                  <div className="text-small text-default-500">
                    {match.deckA.name} Wins
                  </div>
                  <div className="text-small text-default-400">
                    ({historicalStats.deckAWinRate}%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {historicalStats.draws}
                  </div>
                  <div className="text-small text-default-500">Draws</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger">
                    {historicalStats.deckBWins}
                  </div>
                  <div className="text-small text-default-500">
                    {match.deckB.name} Wins
                  </div>
                  <div className="text-small text-default-400">
                    ({historicalStats.deckBWinRate}%)
                  </div>
                </div>
              </div>

              <Divider />

              {/* Additional Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-small font-semibold">Match Summary</h4>
                  <div className="flex justify-between">
                    <span className="text-small text-default-500">
                      Total Matches
                    </span>
                    <span className="text-small font-medium">
                      {historicalStats.totalHistoricalMatches}
                    </span>
                  </div>
                  {historicalStats.lastMatchDate && (
                    <div className="flex justify-between">
                      <span className="text-small text-default-500">
                        Last Match
                      </span>
                      <span className="text-small font-medium">
                        {historicalStats.lastMatchDate.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-small font-semibold">Average Scores</h4>
                  <div className="flex justify-between">
                    <span className="text-small text-default-500">
                      {match.deckA.name} Avg
                    </span>
                    <span className="text-small font-medium font-mono">
                      {historicalStats.averageScore.deckA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-small text-default-500">
                      {match.deckB.name} Avg
                    </span>
                    <span className="text-small font-medium font-mono">
                      {historicalStats.averageScore.deckB}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Matches Table */}
              <div className="space-y-3">
                <h4 className="text-small font-semibold">Recent Matches</h4>
                <Table aria-label="Recent Matches" removeWrapper>
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>SCORE</TableColumn>
                    <TableColumn>WINNER</TableColumn>
                    <TableColumn>TOURNAMENT</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {historicalMatches
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .filter((historicalMatch) => {
                        return match.id !== historicalMatch.id;
                      })
                      .slice(0, 5)
                      .map((historicalMatch) => {
                        const historicalDate = new Date(historicalMatch.date);
                        const isCurrentDeckAInHistorical =
                          historicalMatch.deckA.id === match.deckA.id;
                        const currentDeckAScore = isCurrentDeckAInHistorical
                          ? historicalMatch.deckAScore
                          : historicalMatch.deckBScore;
                        const currentDeckBScore = isCurrentDeckAInHistorical
                          ? historicalMatch.deckBScore
                          : historicalMatch.deckAScore;

                        return (
                          <TableRow key={historicalMatch.id}>
                            <TableCell>
                              {historicalDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">
                                {currentDeckAScore} - {currentDeckBScore}
                              </span>
                            </TableCell>
                            <TableCell>
                              {!historicalMatch.winner ? (
                                <span className="text-warning">Draw</span>
                              ) : historicalMatch.winner.id ===
                                match.deckA.id ? (
                                <span className="text-success">
                                  {match.deckA.name}
                                </span>
                              ) : (
                                <span className="text-danger">
                                  {match.deckB.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {historicalMatch.tournament ? (
                                <Link
                                  href={`/tournaments/${historicalMatch.tournament.id}`}
                                  className="text-primary hover:underline text-small"
                                >
                                  {historicalMatch.tournament.name}
                                </Link>
                              ) : (
                                <span className="text-small text-default-400">
                                  Friendly
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Match Notes */}
      {/* {match.notes && (
        <Card className="mb-6">
          <CardHeader className="flex gap-3">
            <IconNotes className="text-primary" size={24} />
            <div className="flex flex-col">
              <p className="text-md font-semibold">Match Notes</p>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-small whitespace-pre-wrap">{match.notes}</p>
          </CardBody>
        </Card>
      )} */}
    </div>
  );
}
