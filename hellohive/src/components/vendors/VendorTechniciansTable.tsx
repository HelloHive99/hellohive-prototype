import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Technician } from '@/data/seed-data';

interface VendorTechniciansTableProps {
  technicians: Technician[];
  canManage: boolean;
  onAddTechnician: () => void;
  onEditTechnician?: (techId: string) => void;
  onDeactivateTechnician?: (techId: string) => void;
}

export function VendorTechniciansTable({
  technicians,
  canManage,
  onAddTechnician,
  onEditTechnician,
  onDeactivateTechnician,
}: VendorTechniciansTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'completed';
      case 'on-job':
        return 'in-progress';
      case 'off-shift':
        return 'pending';
      default:
        return 'overdue';
    }
  };

  return (
    <Card className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Technicians
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button onClick={onAddTechnician}>+ Add Technician</Button>
        )}
      </div>

      {technicians.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-400">
            No technicians assigned to this vendor.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/20">
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Skills
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Assigned Jobs
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                {canManage && (
                  <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => {
                const visibleSkills = tech.skillTags.slice(0, 2);
                const remainingSkills = tech.skillTags.length - 2;

                return (
                  <tr
                    key={tech.id}
                    className="border-b border-gray-700/20 last:border-0 hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="py-6">
                      <p className="text-sm font-medium text-white">
                        {tech.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{tech.phone}</p>
                    </td>
                    <td className="py-6">
                      <p className="text-sm text-white">{tech.roleTitle}</p>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-wrap gap-1">
                        {visibleSkills.map((skill) => (
                          <Badge key={skill} variant="pending" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {remainingSkills > 0 && (
                          <Badge variant="pending" className="text-xs">
                            +{remainingSkills} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-6">
                      <Badge variant={getStatusVariant(tech.currentStatus)}>
                        {tech.currentStatus}
                      </Badge>
                    </td>
                    <td className="py-6">
                      <p className="text-sm text-white">
                        {tech.assignedWorkOrdersCount}
                      </p>
                    </td>
                    <td className="py-6">
                      <p className="text-sm text-white">
                        {tech.internalRating.toFixed(1)} ⭐
                      </p>
                    </td>
                    {canManage && (
                      <td className="py-6">
                        <div className="flex gap-2">
                          {onEditTechnician && (
                            <button
                              onClick={() => onEditTechnician(tech.id)}
                              className="text-xs text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {onDeactivateTechnician && (
                            <button
                              onClick={() => onDeactivateTechnician(tech.id)}
                              className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
