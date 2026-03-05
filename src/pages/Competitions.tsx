import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions } from '@/lib/api';
import CompetitionCard from '@/components/CompetitionCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function Competitions() {
  const { data: competitions = [], isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: fetchCompetitions,
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  if (isLoading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Fout: {(error as Error).message}</div>;
  }

  const filtered = competitions
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filters = [
    { key: 'all' as const, label: 'Alles' },
    { key: 'active' as const, label: 'Actief' },
    { key: 'upcoming' as const, label: 'Gepland' },
    { key: 'completed' as const, label: 'Afgelopen' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-display">Wedstrijden</h1>
        <Button asChild>
          <Link to="/competitions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe wedstrijd
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek wedstrijd..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {filters.map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-muted-foreground"
          >
            Geen wedstrijden gevonden.
          </motion.p>
        ) : (
          filtered.map((comp, i) => (
            <CompetitionCard key={comp.id} competition={comp} index={i} />
          ))
        )}
      </div>
    </div>
  );
}