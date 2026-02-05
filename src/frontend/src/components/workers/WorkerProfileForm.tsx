import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Loader2 } from 'lucide-react';
import type { PartialWorkerProfile, ServiceCategory } from '../../backend';
import { ExternalBlob } from '../../backend';

interface WorkerProfileFormProps {
  initialData?: PartialWorkerProfile & { profileImage?: ExternalBlob };
  onSubmit: (data: PartialWorkerProfile, imageFile?: File) => void;
  isLoading?: boolean;
}

const categoryOptions: { value: string; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'other', label: 'Other' },
];

function getCategoryValue(category?: ServiceCategory): string {
  if (!category) return 'plumbing';
  if (category.__kind__ === 'plumbing') return 'plumbing';
  if (category.__kind__ === 'electrical') return 'electrical';
  if (category.__kind__ === 'cleaning') return 'cleaning';
  if (category.__kind__ === 'gardening') return 'gardening';
  if (category.__kind__ === 'other') return 'other';
  return 'plumbing';
}

function createCategory(value: string, otherText?: string): ServiceCategory {
  switch (value) {
    case 'plumbing': return { __kind__: 'plumbing', plumbing: null };
    case 'electrical': return { __kind__: 'electrical', electrical: null };
    case 'cleaning': return { __kind__: 'cleaning', cleaning: null };
    case 'gardening': return { __kind__: 'gardening', gardening: null };
    case 'other': return { __kind__: 'other', other: otherText || 'Other Service' };
    default: return { __kind__: 'plumbing', plumbing: null };
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function WorkerProfileForm({ initialData, onSubmit, isLoading }: WorkerProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [categoryValue, setCategoryValue] = useState(getCategoryValue(initialData?.category));
  const [otherCategory, setOtherCategory] = useState(
    initialData?.category && initialData.category.__kind__ === 'other' ? initialData.category.other : ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [serviceArea, setServiceArea] = useState(initialData?.serviceArea || '');
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate ? Number(initialData.hourlyRate).toString() : '');
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.profileImage?.getDirectURL() || null
  );
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) {
      setImageFile(null);
      setImagePreview(initialData?.profileImage?.getDirectURL() || null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setImageError('Please select a valid image file (JPG, PNG, or WebP)');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profile: PartialWorkerProfile = {
      displayName,
      category: createCategory(categoryValue, otherCategory),
      description,
      serviceArea,
      hourlyRate: BigInt(hourlyRate || '0'),
      isActive,
      phoneNumber,
    };

    onSubmit(profile, imageFile || undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Profile</CardTitle>
        <CardDescription>
          Complete your profile to start receiving booking requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileImage">Profile Image</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a profile photo (JPG, PNG, or WebP, max 5MB)
                </p>
              </div>
            </div>
            {imageError && (
              <Alert variant="destructive">
                <AlertDescription>{imageError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your professional name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Contact Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              required
            />
            <p className="text-xs text-muted-foreground">
              Clients will use this number to contact you about bookings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Service Category *</Label>
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoryValue === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="otherCategory">Specify Service *</Label>
              <Input
                id="otherCategory"
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="e.g., Carpentry, Painting"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your services and experience"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area *</Label>
            <Input
              id="serviceArea"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g., Downtown, North Side, 10 mile radius"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="50"
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to clients
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Profile' : 'Create Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
