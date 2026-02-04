import { useGetMyWorkerProfile, useCreateWorkerProfile, useUpdateWorkerProfile } from '../hooks/useQueries';
import WorkerProfileForm from '../components/workers/WorkerProfileForm';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { PartialWorkerProfile } from '../backend';

export default function WorkerProfile() {
  const { data: profile, isLoading } = useGetMyWorkerProfile();
  const createProfile = useCreateWorkerProfile();
  const updateProfile = useUpdateWorkerProfile();

  const handleSubmit = async (data: PartialWorkerProfile) => {
    try {
      if (profile) {
        await updateProfile.mutateAsync(data);
        toast.success('Profile updated successfully!');
      } else {
        await createProfile.mutateAsync(data);
        toast.success('Profile created successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          {profile ? 'Update your professional profile' : 'Create your professional profile to start receiving bookings'}
        </p>
      </div>

      <WorkerProfileForm
        initialData={profile ? {
          displayName: profile.displayName,
          category: profile.category,
          description: profile.description,
          serviceArea: profile.serviceArea,
          hourlyRate: profile.hourlyRate,
          isActive: profile.isActive,
        } : undefined}
        onSubmit={handleSubmit}
        isLoading={createProfile.isPending || updateProfile.isPending}
      />
    </div>
  );
}
