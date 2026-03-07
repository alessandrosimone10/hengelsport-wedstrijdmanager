import { useEffect } from 'react';
import { Trophy, Users, Weight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions } from '@/lib/api';
import { getTotalWeight, formatWeight } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import CompetitionCard from '@/components/CompetitionCard';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Index() {
  const { data: competitions = [], isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: fetchCompetitions
  });

  if (isLoading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Fout: {error.message}</div>;
  }

  const activeComps = competitions.filter(c => c.status === 'active');
  const totalParticipants = competitions.reduce((s, c) => s + c.participants.length, 0);
  const totalWeight = competitions.reduce(
    (s, c) => s + c.participants.reduce((s2, p) => s2 + getTotalWeight(p), 0), 0
  );

  const recentComps = [...competitions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Beheer je hengelsport wedstrijden op één plek.
          </p>
        </div>
        <Button asChild>
          <Link to="/competitions/new">
            <Trophy className="mr-2 h-4 w-4" />
            Nieuwe wedstrijd
          </Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          icon={Trophy} 
          label="Wedstrijden" 
          value={competitions.length} 
          subtitle={`${activeComps.length} actief`} 
          delay={0.1} 
        />
        <StatCard 
          icon={Users} 
          label="Deelnemers" 
          value={totalParticipants} 
          delay={0.15} 
        />
        <StatCard 
          icon={Weight} 
          label="Totaal gewicht" 
          value={formatWeight(totalWeight)} 
          delay={0.2} 
        />
      </div>

      {/* Recente wedstrijden */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold font-display">Recente wedstrijden</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/competitions">Alles bekijken</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {recentComps.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nog geen wedstrijden. Maak je eerste wedstrijd aan!
            </p>
          ) : (
            recentComps.map((comp, i) => (
              <CompetitionCard key={comp.id} competition={comp} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
