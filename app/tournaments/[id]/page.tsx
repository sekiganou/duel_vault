"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTournamentById } from "@/lib/api/tournaments";
import { TournamentWithRelations } from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import {
  IconChevronLeft,
  IconRefresh,
  IconCalendar,
  IconLink,
  IconTrophy,
  IconSwords,
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

const getTournamentStatus = (tournament: TournamentWithRelations): string => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = tournament.endDate ? new Date(tournament.endDate) : null;

  if (now < startDate) return "upcoming";
  if (endDate && now > endDate) return "completed";
  return "active";
};

const statusColorMap: Record<string, "primary" | "success" | "default"> = {
  upcoming: "primary",
  active: "success",
  completed: "default",
};

export default function ViewTournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<TournamentWithRelations | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTournamentById(Number(id))
      .then(setTournament)
      .catch((err) => {
        setError(err.message || "Failed to load tournament");
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const status = getTournamentStatus(tournament);
  const totalMatches = tournament.matches.length;

  // Calculate tournament duration
  const startDate = new Date(tournament.startDate);
  const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
  const now = new Date();

  let durationText = "";
  if (status === "upcoming") {
    const daysUntilStart = Math.ceil(
      (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`;
  } else if (status === "active") {
    const daysSinceStart = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Running for ${daysSinceStart} day${daysSinceStart !== 1 ? "s" : ""}`;
  } else if (endDate) {
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    durationText = `Duration: ${duration} day${duration !== 1 ? "s" : ""}`;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <IconChevronLeft />
        </Button>
        <div className="flex-1">
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
      </div>

      {/* Tournament Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex gap-3">
            <IconTrophy className="text-primary" size={24} />
            <div className="flex flex-col">
              <p className="text-md font-semibold">Tournament Details</p>
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

              {endDate && (
                <div className="flex items-center gap-3">
                  <IconCalendar size={20} className="text-default-400" />
                  <div>
                    <p className="text-small text-default-500">End Date</p>
                    <p className="text-small font-medium">
                      {endDate.toLocaleDateString()} at{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <IconSwords size={20} className="text-default-400" />
                <div>
                  <p className="text-small text-default-500">Total Matches</p>
                  <p className="text-small font-medium">{totalMatches}</p>
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
            <div className="flex flex-col">
              <p className="text-md font-semibold">Tournament Stats</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between">
              <span className="text-small text-default-500">Participants</span>
              <span className="text-small font-medium">
                {tournament.deckStats.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-small text-default-500">
                Matches Played
              </span>
              <span className="text-small font-medium">{totalMatches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-small text-default-500">Format</span>
              <span className="text-small font-medium">
                {tournament.format.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-small text-default-500">Status</span>
              <Chip color={statusColorMap[status]} size="sm" variant="flat">
                {capitalize(status)}
              </Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      <Divider className="my-8" />

      {/* Tournament Rankings */}
      {tournament.deckStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tournament Rankings</h2>
          <Card>
            <CardBody>
              <Table aria-label="Tournament Rankings">
                <TableHeader>
                  <TableColumn>RANK</TableColumn>
                  <TableColumn>DECK</TableColumn>
                  <TableColumn>ARCHETYPE</TableColumn>
                  <TableColumn>WINS</TableColumn>
                  <TableColumn>LOSSES</TableColumn>
                  <TableColumn>TIES</TableColumn>
                  <TableColumn>WIN RATE</TableColumn>
                </TableHeader>
                <TableBody>
                  {tournament.deckStats
                    .sort((a, b) => a.finalRank - b.finalRank)
                    .map((deckStat) => {
                      const totalGames =
                        deckStat.wins + deckStat.losses + deckStat.ties;
                      const winRate =
                        totalGames > 0
                          ? ((deckStat.wins / totalGames) * 100).toFixed(1)
                          : "0";

                      return (
                        <TableRow key={deckStat.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {deckStat.finalRank === 1 && (
                                <span className="text-yellow-500">🥇</span>
                              )}
                              {deckStat.finalRank === 2 && (
                                <span className="text-gray-400">🥈</span>
                              )}
                              {deckStat.finalRank === 3 && (
                                <span className="text-orange-600">🥉</span>
                              )}
                              <span className="font-semibold">
                                #{deckStat.finalRank}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <User
                              name={deckStat.deck.name}
                              description={deckStat.deck.format.name}
                              avatarProps={{
                                src: deckStat.deck.avatar || undefined,
                                size: "sm",
                              }}
                            />
                          </TableCell>
                          <TableCell>{deckStat.deck.archetype.name}</TableCell>
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
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tournament Matches */}
      {tournament.matches.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Tournament Matches</h2>
          <Card>
            <CardBody>
              <Table aria-label="Tournament Matches">
                <TableHeader>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>DECK A</TableColumn>
                  <TableColumn>DECK B</TableColumn>
                  <TableColumn>SCORE</TableColumn>
                  <TableColumn>WINNER</TableColumn>
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
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Empty States */}
      {tournament.deckStats.length === 0 && tournament.matches.length === 0 && (
        <div className="text-center py-12">
          <IconTrophy size={48} className="text-default-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-default-500 mb-2">
            No Tournament Data
          </h3>
          <p className="text-default-400">
            This tournament doesn't have any matches or rankings yet.
          </p>
        </div>
      )}
    </div>
  );
}
