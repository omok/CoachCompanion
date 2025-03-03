import React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertPlayerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PlayerFormProps {
  teamId: number;
  onSuccess?: () => void;
}

export function PlayerForm({ teamId, onSuccess }: PlayerFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(insertPlayerSchema.omit({ teamId: true })),
    defaultValues: {
      name: "",
      parentId: 0, // This would need to be set based on the logged-in parent ID or selected from a dropdown
      jerseyNumber: "",
      active: true
    }
  });

  const activeValue = watch('active');

  // Add player mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, teamId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name</Label>
            <Input 
              id="name" 
              {...register('name')} 
              placeholder="Enter player name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jerseyNumber">Jersey Number</Label>
            <Input 
              id="jerseyNumber" 
              {...register('jerseyNumber')} 
              placeholder="Enter jersey number"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={activeValue}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
            <Label htmlFor="active">Active Player</Label>
          </div>
          
          {/* This would be replaced with your actual parent selection logic */}
          <input type="hidden" {...register('parentId')} value={1} />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Player
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 