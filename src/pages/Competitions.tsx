import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCompetitions, deleteCompetition } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

export default function Competitions() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: fetchCompetitions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      toast.success('Wedstrijd verwijderd');
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
    onError: (err: Error) => toast.error(`Verwijderen mislukt: ${err.message}`),
  });

  const filtered = competitions?.filter(c => filter === 'all' || c.status === filter) ?? [];

  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fout bij ophalen: {(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Alles</Button>
        <Button size="sm" variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>Gepland</Button>
        <Button size="sm" variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>Actief</Button>
        <Button size="sm" variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Afgelopen</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {filtered.length === 0 && <p>Geen wedstrijden gevonden.</p>}
        {filtered.map(c => (
          <Card key={c.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{c.name}</CardTitle>
              <Badge variant={statusConfig[c.status].variant}>{statusConfig[c.status].label}</Badge>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p>{new Date(c.date).toLocaleDateString('nl-NL')}</p>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="icon" asChild>
                  <Link to={`/competitions/${c.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
