import { useGetMyWorkerProfile, useCreateWorkerProfile, useUpdateWorkerProfile, useUploadProfileImage, useRemoveProfileImage } from '../hooks/useQueries';
import WorkerProfileForm from '../components/workers/WorkerProfileForm';
import { toast } from 'sonner';
import type { PartialWorkerProfile } from '../backend';
import { ExternalBlob } from '../backend';
import { useState } from 'react';

export default function WorkerProfile() {
  const { data: profile, isLoading } = useGetMyWorkerProfile();
  const createProfile = useCreateWorkerProfile();
  const updateProfile = useUpdateWorkerProfile();
  const uploadImage = useUploadProfileImage();
  const removeImage = useRemoveProfileImage();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (data: PartialWorkerProfile, imageFile?: File) => {
    try {
      // First, save the profile data
      if (profile) {
        await updateProfile.mutateAsync(data);
      } else {
        await createProfile.mutateAsync(data);
      }

      // Then handle image upload/removal
      if (imageFile) {
        // Upload new image
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
        await uploadImage.mutateAsync(blob);
        setUploadProgress(0);
        toast.success('Profile and image updated successfully!');
      } else if (profile?.profileImage && !imageFile) {
        // Remove existing image if user cleared it
        await removeImage.mutateAsync();
        toast.success('Profile updated and image removed!');
      } else {
        toast.success(profile ? 'Profile updated successfully!' : 'Profile created successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
      setUploadProgress(0);
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

  const isSaving = createProfile.isPending || updateProfile.isPending || uploadImage.isPending || removeImage.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          {profile ? 'Update your professional profile' : 'Create your professional profile to start receiving bookings'}
        </p>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-4 p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Uploading image...</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <WorkerProfileForm
        initialData={profile ? {
          displayName: profile.displayName,
          category: profile.category,
          description: profile.description,
          serviceArea: profile.serviceArea,
          hourlyRate: profile.hourlyRate,
          isActive: profile.isActive,
          phoneNumber: profile.phoneNumber,
          profileImage: profile.profileImage,
        } : undefined}
        onSubmit={handleSubmit}
        isLoading={isSaving}
      />
    </div>
  );
}
