import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PracticeNote, Player, Attendance, insertPracticeNoteSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
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
        form.reset({
          notes: existingNote.notes,
          playerIds: existingNote.playerIds || []
        });
      } else {
        form.reset({
          notes: "",
          playerIds: []
        });
      }
    }
  }, [selectedDate, notes, form]);

  // Update the mutation to log everything
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
     
      try {
        // Data should already have practiceDate and playerIds from onSubmit
        const requestData = {
          notes: data.notes,
          playerIds: data.playerIds,
          practiceDate: data.practiceDate,
        };


        // Make a direct fetch call instead of using apiRequest
        // Use absolute URL to ensure it's hitting the right endpoint
        const url = `/api/teams/${teamId}/practice-notes`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include',
        });
        
        
        // Try to parse the response as JSON first
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = { success: true, text };
        }
        
        if (!response.ok) {
          console.error('Error response:', responseData);
          throw new Error(`Failed to save practice note: ${JSON.stringify(responseData)}`);
        }
        
        return responseData;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/practice-notes`] });
      toast({
        title: "Practice note saved",
        description: "Your practice note has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      
      // Extract the error message from the JSON if possible
      let errorMessage = error.message;
      try {
        // Check if the error message contains JSON
        if (error.message.includes('{')) {
          const jsonStart = error.message.indexOf('{');
          const jsonPart = error.message.substring(jsonStart);
          const errorData = JSON.parse(jsonPart);
          
          // Use the details from the error response if available
          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          }
        }
      } catch (e) {
        // If parsing fails, just use the original error message
        console.error('Error parsing error message:', e);
      }
      
      toast({
        title: "Failed to save note",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Simplified function to save practice notes
  const savePracticeNote = (notes: string) => {
    // Check if there are any present players
    if (presentPlayerIds.length === 0) {
      toast({
        title: "No players present",
        description: "Please mark at least one player as present before saving a practice note.",
        variant: "destructive",
      });
      return;
    }
    
    // Format the date correctly
    const dateStr = formatDateString(selectedDate);
    const practiceDate = new Date(`${dateStr}T12:00:00.000Z`);
    
    // Create the complete data object
    const completeData = {
      notes: notes || 'Practice session',
      practiceDate: practiceDate.toISOString(),
      playerIds: presentPlayerIds
    };
    
    
    // Create a toast notification to show we're trying to save
    toast({
      title: "Saving practice note...",
      description: "Attempting to save your practice note.",
    });
    
    // Call the mutation
    try {
      createNoteMutation.mutate(completeData);
    } catch (error) {
      console.error('Error calling mutation:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    }
  };

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
    return players?.find(p => p.id === playerId)?.name;
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
              onSubmit={(e) => e.preventDefault()} // Prevent any form submission
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
                      {players?.find(p => p.id === playerId)?.name}
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

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  disabled={createNoteMutation.isPending || presentPlayerIds.length === 0}
                  onClick={() => {
                    const notes = form.getValues("notes");
                    savePracticeNote(notes);
                  }}
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Practice Note'
                  )}
                </Button>
                
              </div>
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
                          {players?.find(p => p.id === playerId)?.name}
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