import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TeamMemberWithUser } from "@shared/schema";

interface TeamMemberFormData {
  email: string;
  role: string;
}

export function TeamMemberList({ teamId }: { teamId: number }) {
  const { canManageTeamSettings } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberWithUser | null>(null);

  const form = useForm<TeamMemberFormData>({
    defaultValues: {
      email: "",
      role: "TeamManager"
    }
  });

  const { data: members, isLoading } = useQuery<TeamMemberWithUser[]>({
    queryKey: [`/api/teams/${teamId}/members`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/teams/${teamId}/members`);
      if (!res.ok) {
        throw new Error("Failed to fetch team members");
      }
      return res.json();
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/members`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add team member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      form.reset();
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: number; role: string }) => {
      const res = await apiRequest(
        "PUT", 
        `/api/teams/${teamId}/members/${data.memberId}`,
        { role: data.role }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update team member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      form.reset();
      setDialogOpen(false);
      setEditingMember(null);
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/teams/${teamId}/members/${userId}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove team member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    }
  });

  const handleEditMember = (member: TeamMemberWithUser) => {
    if (member.isOwner) {
      toast({
        title: "Cannot Edit Owner",
        description: "The team owner's role cannot be modified",
        variant: "destructive",
      });
      return;
    }
    setEditingMember(member);
    form.reset({
      email: member.userEmail,
      role: member.role
    });
    setDialogOpen(true);
  };

  const handleRemoveMember = (member: TeamMemberWithUser) => {
    if (member.isOwner) {
      toast({
        title: "Cannot Remove Owner",
        description: "The team owner cannot be removed",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to remove this team member?')) {
      removeMemberMutation.mutate(member.userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Members</h2>
        {false && canManageTeamSettings(teamId) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingMember(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit((data) =>
                  editingMember
                    ? updateMemberMutation.mutate({ memberId: editingMember.id, role: data.role })
                    : addMemberMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="member@example.com"
                    disabled={!!editingMember}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    onValueChange={(value) => form.setValue('role', value)}
                    value={form.getValues('role')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AssistantCoach">Assistant Coach</SelectItem>
                      <SelectItem value="TeamManager">Team Manager</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingMember(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      addMemberMutation.isPending || updateMemberMutation.isPending
                    }
                  >
                    {addMemberMutation.isPending || updateMemberMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingMember ? "Editing..." : "Adding..."}
                      </>
                    ) : (
                      editingMember ? "Edit Team Member" : "Add Team Member"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManageTeamSettings(teamId) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map((member) => (
            <TableRow key={member.userId}>
              <TableCell>{member.userName}</TableCell>
              <TableCell>{member.userEmail}</TableCell>
              <TableCell>
                {member.isOwner ? "Owner" : member.role}
              </TableCell>
              {canManageTeamSettings(teamId) && !member.isOwner && (
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit member"
                    onClick={() => handleEditMember(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remove member"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <span className="text-red-500">×</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 