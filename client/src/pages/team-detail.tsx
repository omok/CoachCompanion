import { usePermissions } from '../hooks/usePermissions';

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const { canManageTeamSettings } = usePermissions();
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{team?.name}</h1>
          <p className="text-gray-600">{team?.description}</p>
        </div>
        
        {canManageTeamSettings(Number(teamId)) && (
          <Button 
            variant="outline" 
            onClick={() => navigate(`/teams/${teamId}/settings`)}
          >
            <GearIcon className="h-4 w-4 mr-2" />
            Team Settings
          </Button>
        )}
      </div>
      
      {/* ... existing component JSX ... */}
    </div>
  );
} 