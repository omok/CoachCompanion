import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SessionNote, insertSessionNoteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, Tag, Search } from "lucide-react";
import { format } from "date-fns";

export function SessionNotes({ teamId }: { teamId: number }) {
  const [newTag, setNewTag] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(
      insertSessionNoteSchema.omit({ teamId: true, coachId: true })
    ),
  });

  const { data: notes, isLoading } = useQuery<SessionNote[]>({
    queryKey: [`/api/teams/${teamId}/notes`],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/notes`, {
        ...data,
        tags: selectedTags,
        date: new Date(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/notes`] });
      form.reset();
      setSelectedTags([]);
    },
  });

  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag("");
    }
  };

  const filteredNotes = notes?.filter((note) => {
    const matchesSearch = note.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = filterTags.length === 0 || 
      filterTags.every(tag => note.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Get unique tags from all notes
  const allTags = Array.from(
    new Set(notes?.flatMap((note) => note.tags || []) || [])
  );

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Session Note</CardTitle>
          <CardDescription>Record notes from today's practice session</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => createNoteMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Enter your session notes here..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTags(selectedTags.filter((t) => t !== tag))
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={createNoteMutation.isPending}>
              Save Note
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
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFilterTags(
                    filterTags.includes(tag)
                      ? filterTags.filter((t) => t !== tag)
                      : [...filterTags, tag]
                  );
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-semibold">Previous Notes</h2>
        {filteredNotes?.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {format(new Date(note.date), "MMMM d, yyyy 'at' h:mm a")}
              </CardTitle>
              <div className="flex gap-1 flex-wrap">
                {note.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
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