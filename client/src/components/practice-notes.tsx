import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PracticeNote, Player, Attendance, insertPracticeNoteSchema } from "@shared/schema";
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
import { Loader2, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function PracticeNotes({ teamId }: { teamId: number }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlayers, setFilterPlayers] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [presentPlayerIds, setPresentPlayerIds] = useState<number[]>([]);

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

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  // Helper function to format date to YYYY-MM-DD
  function formatDateString(date: Date): string {
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
  }

  // Update present players when date changes
  useEffect(() => {
    if (attendance) {
      const selectedDateStr = formatDateString(selectedDate);
      const presentPlayers = attendance
        .filter(record => {
          const recordDateStr = formatDateString(new Date(record.date));
          return recordDateStr === selectedDateStr && record.present;
        })
        .map(record => record.playerId);

      setPresentPlayerIds(presentPlayers);
    }
  }, [selectedDate, attendance]);

  // Load existing note when date changes
  useEffect(() => {
    if (notes) {
      const selectedDateStr = formatDateString(selectedDate);
      const existingNote = notes.find(note => {
        const noteDateStr = formatDateString(new Date(note.practiceDate));
        return noteDateStr === selectedDateStr;
      });

      if (existingNote) {
        form.setValue("notes", existingNote.notes);
      } else {
        form.setValue("notes", "");
      }
    }
  }, [selectedDate, notes, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get the date string in YYYY-MM-DD format
      const dateStr = formatDateString(selectedDate);
      // Create date at noon UTC to avoid timezone issues
      const practiceDate = new Date(`${dateStr}T12:00:00.000Z`);

      const res = await apiRequest("POST", `/api/teams/${teamId}/practice-notes`, {
        ...data,
        playerIds: presentPlayerIds,
        practiceDate: practiceDate.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/practice-notes`] });
      toast({
        title: "Practice note saved",
        description: "Your practice note has been saved successfully.",
      });
    },
  });

  const filteredNotes = notes?.filter((note) => {
    const matchesSearch = note.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlayers = filterPlayers.length === 0 || 
      filterPlayers.every(playerId => note.playerIds?.includes(playerId));
    return matchesSearch && matchesPlayers;
  });

  if (isLoadingNotes || isLoadingPlayers || isLoadingAttendance) {
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
    <div className="grid md:grid-cols-2 gap-6">
      {/* New Practice Note Form */}
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
                <div className="flex gap-2 flex-wrap">
                  {presentPlayerIds.map((playerId) => (
                    <Badge key={playerId} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {getPlayerName(playerId)}
                    </Badge>
                  ))}
                </div>
                {presentPlayerIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No players marked as present for this date. Mark players as present in the Attendance tab first.
                  </p>
                )}
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

              <Button type="submit" disabled={createNoteMutation.isPending || presentPlayerIds.length === 0}>
                {createNoteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Practice Note'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Practice Notes List */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Practice Notes History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
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
            </div>

            <div className="space-y-4">
              {filteredNotes?.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                      {format(new Date(note.practiceDate), "MMMM d, yyyy")}
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
              {(!filteredNotes || filteredNotes.length === 0) && (
                <div className="text-center text-muted-foreground py-4">
                  No practice notes found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}