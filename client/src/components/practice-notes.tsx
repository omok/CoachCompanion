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

  const form = useForm({
    resolver: zodResolver(insertPracticeNoteSchema.omit({ teamId: true, coachId: true })),
    defaultValues: {
      notes: "",
      playerIds: [] as number[]
    }
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

  // Get present players for selected date
  const getPresentPlayers = (date: Date) => {
    if (!attendance) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance
      .filter(record => {
        const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
        return recordDate === dateStr && record.present;
      })
      .map(record => record.playerId);
  };

  // Update form when date changes
  useEffect(() => {
    const presentPlayers = getPresentPlayers(selectedDate);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const existingNote = notes?.find(note => 
      format(new Date(note.practiceDate), 'yyyy-MM-dd') === dateStr
    );

    form.reset({
      notes: existingNote?.notes || "",
      playerIds: presentPlayers
    });
  }, [selectedDate, notes, attendance, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      const presentPlayers = getPresentPlayers(selectedDate);

      if (presentPlayers.length === 0) {
        throw new Error("No players marked as present for this date");
      }

      const response = await apiRequest(
        "POST", 
        `/api/teams/${teamId}/practice-notes`,
        {
          notes: data.notes,
          playerIds: presentPlayers,
          practiceDate: selectedDate.toISOString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save practice note");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/practice-notes`] });
      toast({
        title: "Success",
        description: "Practice note saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const presentPlayers = getPresentPlayers(selectedDate);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Practice Note Form */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Notes</CardTitle>
          <CardDescription>Record notes for today's practice session</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((data) => createNoteMutation.mutate(data))} className="space-y-4">
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
                {presentPlayers.map((playerId) => (
                  <Badge key={playerId} variant="secondary">
                    {players?.find(p => p.id === playerId)?.name}
                  </Badge>
                ))}
              </div>
              {presentPlayers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No players marked as present for this date
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Enter practice notes..."
                className="min-h-[150px]"
              />
            </div>

            <Button 
              type="submit" 
              disabled={createNoteMutation.isPending || presentPlayers.length === 0}
            >
              {createNoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Notes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Practice Notes History */}
      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
          <div className="mt-2">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotes?.map((note) => (
              <Card key={note.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {format(new Date(note.practiceDate), "MMMM d, yyyy")}
                  </CardTitle>
                  <div className="flex gap-1 flex-wrap">
                    {note.playerIds?.map((playerId) => (
                      <Badge key={playerId} variant="outline" className="text-xs">
                        {players?.find(p => p.id === playerId)?.name}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{note.notes}</p>
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
  );
}