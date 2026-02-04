import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PartialWorkerProfile, ServiceCategory } from '../../backend';

interface WorkerProfileFormProps {
  initialData?: PartialWorkerProfile;
  onSubmit: (data: PartialWorkerProfile) => void;
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

export default function WorkerProfileForm({ initialData, onSubmit, isLoading }: WorkerProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [categoryValue, setCategoryValue] = useState(getCategoryValue(initialData?.category));
  const [otherCategory, setOtherCategory] = useState(
    initialData?.category && initialData.category.__kind__ === 'other' ? initialData.category.other : ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [serviceArea, setServiceArea] = useState(initialData?.serviceArea || '');
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate ? Number(initialData.hourlyRate).toString() : '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profile: PartialWorkerProfile = {
      displayName,
      category: createCategory(categoryValue, otherCategory),
      description,
      serviceArea,
      hourlyRate: BigInt(hourlyRate || '0'),
      isActive,
    };

    onSubmit(profile);
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
            {isLoading ? 'Saving...' : initialData ? 'Update Profile' : 'Create Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
