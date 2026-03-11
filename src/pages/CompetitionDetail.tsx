import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCompetition,
  deleteCompetition,
  updateCompetitionStatus,
  addParticipant,
  addCatch,
  patchCompetition,
  assignNumbersRandomly,
  authHeaders,
} from '@/lib/api';
import { getTotalWeight, formatWeight } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Coins,
  Download,
  Fish,
  Hash,
  MapPin,
  Plus,
  Shuffle,
  Trash2,
  Trophy,
  UserPlus,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/lib/config';

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

// Hulpfunctie voor prijsverdeling
function getDefaultPercentages(count: number): number[] {
  if (count === 1) return [100];
  if (count === 2) return [60, 40];
  if (count === 3) return [50, 30, 20];
  const base = Math.floor(100 / count);
  const rest = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rest ? 1 : 0));
}

// Weer icoon helper
const getWeatherIcon = (code?: string) => {
  if (!code) return <Cloud className="h-10 w-10 text-gray-400" />;
  const c = code.toLowerCase();
  if (c.includes('sun') || c.includes('clear')) return <Sun className="h-10 w-10 text-yellow-500" />;
  if (c.includes('cloud')) return <Cloud className="h-10 w-10 text-gray-500" />;
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="h-10 w-10 text-blue-500" />;
  return <Cloud className="h-10 w-10 text-gray-400" />;
};

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const competitionId = Number(id);

  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const { data: competition, isLoading, error } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => fetchCompetition(competitionId),
    enabled: !isNaN(competitionId),
  });

  useEffect(() => {
    if (!competitionId) return;
    fetchWeather();
  }, [competitionId]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/weather`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Kon weer niet ophalen');
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoadingWeather(false);
    }
  };

  // Mutaties
  const deleteMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      toast.success('Wedstrijd verwijderd');
      navigate('/competitions');
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
    onError: (err: Error) => toast.error(`Verwijderen mislukt: ${err.message}`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateCompetitionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Status bijgewerkt');
    },
    onError: (err: Error) => toast.error(`Status wijzigen mislukt: ${err.message}`),
  });

  const addParticipantMutation = useMutation({
    mutationFn: ({ competitionId, name, number }: { competitionId: number; name: string; number?: number }) => addParticipant(competitionId, name, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Deelnemer toegevoegd');
    },
    onError: (err: Error) => toast.error(`Toevoegen mislukt: ${err.message}`),
  });

  if (isNaN(competitionId)) return <p>Ongeldige wedstrijd ID</p>;
  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fout: {(error as Error).message}</p>;
  if (!competition) return <p>Wedstrijd niet gevonden</p>;

  const status = statusConfig[competition.status];
  const dateStr = new Date(competition.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const ranked = competition.participants ? [...competition.participants].map(p => ({ ...p, total: getTotalWeight(p) })).sort((a, b) => b.total - a.total) : [];

  // Handlers
  const handleDelete = () => deleteMutation.mutate(competitionId);
  const handleStatusChange = (newStatus: string) => statusMutation.mutate({ id: competitionId, status: newStatus });
  const handleAddParticipant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const number = form.get('number') as string;
    if (!name.trim()) return;
    addParticipantMutation.mutate({ competitionId, name: name.trim(), number: number ? Number(number) : undefined });
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/competitions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="flex gap-2">
          {competition.status === 'upcoming' && <Button onClick={() => handleStatusChange('active')}>Start wedstrijd</Button>}
          {competition.status === 'active' && <Button onClick={() => handleStatusChange('completed')}>Beëindig wedstrijd</Button>}
          <Button variant="destructive" onClick={handleDelete}>Verwijderen</Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Deelnemers</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
            <Input name="name" placeholder="Naam deelnemer" required />
            <Input name="number" type="number" placeholder="Nr (opt.)" />
            <Button type="submit">Toevoegen</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Nr</TableHead>
                <TableHead>Gewicht</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.number ?? '—'}</TableCell>
                  <TableCell>{formatWeight(p.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
