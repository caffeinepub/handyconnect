import { useState } from 'react';
import { useBrowseWorkers } from '../hooks/useQueries';
import WorkerCard from '../components/workers/WorkerCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import type { ServiceCategory } from '../backend';

function getCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    all: 'All Categories',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    cleaning: 'Cleaning',
    gardening: 'Gardening',
    other: 'Other',
  };
  return labels[value] || value;
}

function createCategory(value: string): ServiceCategory | null {
  switch (value) {
    case 'plumbing': return { __kind__: 'plumbing', plumbing: null };
    case 'electrical': return { __kind__: 'electrical', electrical: null };
    case 'cleaning': return { __kind__: 'cleaning', cleaning: null };
    case 'gardening': return { __kind__: 'gardening', gardening: null };
    default: return null;
  }
}

export default function BrowseWorkers() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  
  const { data: workers = [], isLoading } = useBrowseWorkers();

  // Filter and sort workers
  let filteredWorkers = workers.filter(w => w.isActive);

  if (categoryFilter !== 'all') {
    const category = createCategory(categoryFilter);
    if (category) {
      filteredWorkers = filteredWorkers.filter(w => {
        const wCat = w.category;
        if (wCat.__kind__ === 'plumbing' && category.__kind__ === 'plumbing') return true;
        if (wCat.__kind__ === 'electrical' && category.__kind__ === 'electrical') return true;
        if (wCat.__kind__ === 'cleaning' && category.__kind__ === 'cleaning') return true;
        if (wCat.__kind__ === 'gardening' && category.__kind__ === 'gardening') return true;
        return false;
      });
    }
  }

  if (sortBy === 'rate-asc') {
    filteredWorkers.sort((a, b) => Number(a.hourlyRate) - Number(b.hourlyRate));
  } else if (sortBy === 'rate-desc') {
    filteredWorkers.sort((a, b) => Number(b.hourlyRate) - Number(a.hourlyRate));
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Find Skilled Local Workers
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with trusted professionals for all your home service needs
            </p>
            <img 
              src="/assets/generated/handyconnect-hero.dim_1600x600.png" 
              alt="HandyConnect Services" 
              className="w-full max-w-3xl mx-auto rounded-lg shadow-soft"
            />
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Filter by Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="gardening">Gardening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">Sort by Rate</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sorting</SelectItem>
                    <SelectItem value="rate-asc">Rate: Low to High</SelectItem>
                    <SelectItem value="rate-desc">Rate: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workers...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((worker) => (
                <WorkerCard key={worker.owner.toString()} worker={worker} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
