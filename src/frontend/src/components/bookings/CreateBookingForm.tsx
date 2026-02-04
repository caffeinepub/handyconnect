import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateBookingFormProps {
  onSubmit: (data: { dateTime: string; jobDetails: string; location: string }) => void;
  isLoading?: boolean;
}

export default function CreateBookingForm({ onSubmit, isLoading }: CreateBookingFormProps) {
  const [dateTime, setDateTime] = useState('');
  const [jobDetails, setJobDetails] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ dateTime, jobDetails, location });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Booking</CardTitle>
        <CardDescription>
          Provide details about the work you need done
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateTime">Preferred Date & Time *</Label>
            <Input
              id="dateTime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              placeholder="e.g., Monday, Feb 10, 2026 at 2:00 PM"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDetails">Job Details *</Label>
            <Textarea
              id="jobDetails"
              value={jobDetails}
              onChange={(e) => setJobDetails(e.target.value)}
              placeholder="Describe the work you need done"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 Main St, Apt 4B"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
