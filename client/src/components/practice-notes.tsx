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
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function PracticeNotes({ teamId }: { teamId: number }) {
  console.log('PracticeNotes component mounted with teamId:', teamId);

  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm({
    resolver: zodResolver(
      insertPracticeNoteSchema.omit({ teamId: true, coachId: true })
    ),
    defaultValues: {
      notes: "",
      playerIds: [] as number[]
    }
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // Fetch practice notes
  const { data: notes, isLoading: isLoadingNotes } = useQuery<PracticeNote[]>({
    queryKey: [`/api/teams/${teamId}/practice-notes`],
  });

  // Fetch players
  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  // Fetch attendance
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  // Get present players for selected date
  const getPresentPlayers = (date: Date) => {
    console.log('Getting present players for date:', date);
    if (!attendance) {
      console.log('No attendance data available');
      return [];
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const presentPlayers = attendance
      .filter(record => {
        const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
        return recordDate === dateStr && record.present;
      })
      .map(record => record.playerId);

    console.log('Present players:', presentPlayers);
    return presentPlayers;
  };

  // Update form when date changes
  useEffect(() => {
    console.log('Date changed to:', selectedDate);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingNote = notes?.find(note => 
      format(new Date(note.practiceDate), 'yyyy-MM-dd') === dateStr
    );
    console.log('Existing note found:', existingNote);

    const presentPlayers = getPresentPlayers(selectedDate);
    console.log('Updating form with present players:', presentPlayers);

    form.reset({
      notes: existingNote?.notes || "",
      playerIds: presentPlayers
    });
  }, [selectedDate, notes, attendance, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      console.log('Starting mutation with data:', data);

      if (!user?.id) {
        console.error('No user ID found');
        throw new Error("You must be logged in to create practice notes");
      }

      const presentPlayers = getPresentPlayers(selectedDate);
      console.log('Present players for mutation:', presentPlayers);

      if (presentPlayers.length === 0) {
        console.error('No players present');
        throw new Error("No players marked as present for this date");
      }

      const requestData = {
        teamId,
        coachId: user.id,
        notes: data.notes,
        playerIds: presentPlayers,
        practiceDate: selectedDate.toISOString()
      };

      console.log('Submitting practice note request:', requestData);

      try {
        const response = await apiRequest(
          "POST",
          `/api/teams/${teamId}/practice-notes`,
          requestData
        );

        console.log('Received response:', response);

        if (!response.ok) {
          const error = await response.json();
          console.error('Response not OK:', error);
          throw new Error(error.error || "Failed to save practice note");
        }

        const result = await response.json();
        console.log('Practice note saved successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in practice note mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ 
        queryKey: [`/api/teams/${teamId}/practice-notes`] 
      });
      toast({
        title: "Success",
        description: "Practice note saved successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredNotes = notes?.filter((note) =>
    note.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingNotes || isLoadingPlayers || isLoadingAttendance) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const presentPlayers = getPresentPlayers(selectedDate);

  const handleSubmit = (data: { notes: string }) => {
    console.log('Form submitted with data:', data);
    createNoteMutation.mutate(data);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Practice Note</CardTitle>
          <CardDescription>Record notes for today's practice</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Practice Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    console.log('Date selected:', date);
                    setSelectedDate(date);
                  }
                }}
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
                  No players marked as present for this date. Please mark attendance first.
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
                "Save Notes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
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