import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PracticeNote, Player, insertPracticeNoteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Search, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

export function PracticeNotes({ teamId }: { teamId: number }) {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlayers, setFilterPlayers] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const form = useForm({
    resolver: zodResolver(
      insertPracticeNoteSchema.omit({ teamId: true, coachId: true })
    ),
  });

  const { data: notes, isLoading: isLoadingNotes } = useQuery<PracticeNote[]>({
    queryKey: [`/api/teams/${teamId}/practice-notes`],
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/practice-notes`, {
        ...data,
        playerIds: selectedPlayers,
        practiceDate: selectedDate.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/practice-notes`] });
      form.reset();
      setSelectedPlayers([]);
    },
  });

  const filteredNotes = notes?.filter((note) => {
    const matchesSearch = note.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlayers = filterPlayers.length === 0 || 
      filterPlayers.every(playerId => note.playerIds?.includes(playerId));
    return matchesSearch && matchesPlayers;
  });

  if (isLoadingNotes || isLoadingPlayers) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const getPlayerName = (playerId: number) => {
    return players?.find(p => p.id === playerId)?.name || 'Unknown Player';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Practice Note</CardTitle>
          <CardDescription>Record notes from today's practice session</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => createNoteMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Practice Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label>Players Present</Label>
              <div className="space-y-2">
                {players?.map((player) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={(checked) => {
                        setSelectedPlayers(
                          checked
                            ? [...selectedPlayers, player.id]
                            : selectedPlayers.filter((id) => id !== player.id)
                        );
                      }}
                    />
                    <Label>{player.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Practice Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Enter your practice notes here..."
                className="min-h-[100px]"
              />
            </div>

            <Button type="submit" disabled={createNoteMutation.isPending}>
              Save Practice Note
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {players?.map((player) => (
              <Badge
                key={player.id}
                variant={filterPlayers.includes(player.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFilterPlayers(
                    filterPlayers.includes(player.id)
                      ? filterPlayers.filter((id) => id !== player.id)
                      : [...filterPlayers, player.id]
                  );
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {player.name}
              </Badge>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-semibold">Previous Practice Notes</h2>
        {filteredNotes?.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {format(new Date(note.practiceDate), "MMMM d, yyyy 'at' h:mm a")}
              </CardTitle>
              <div className="flex gap-1 flex-wrap">
                {note.playerIds?.map((playerId) => (
                  <Badge key={playerId} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {getPlayerName(playerId)}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{note.notes}</p>
            </CardContent>
          </Card>
        ))}
        {filteredNotes?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No notes found matching your search criteria
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
