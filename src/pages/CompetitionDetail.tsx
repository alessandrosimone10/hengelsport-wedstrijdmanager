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
import { API_BASE_URL } from '@/lib/config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ArrowLeft, Calendar, Coins, Download, Fish, Hash, Shuffle, Trash2, Trophy, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

function getDefaultPercentages(count: number): number[] {
  if (count === 1) return [100];
  if (count === 2) return [60, 40];
  if (count === 3) return [50, 30, 20];
  const base = Math.floor(100 / count);
  const rest = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rest ? 1 : 0));
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const competitionId = Number(id);

  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // --- Wedstrijd ophalen ---
  const { data: competition, isLoading, error } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => fetchCompetition(competitionId),
    enabled: !isNaN(competitionId),
  });

  // --- Weer ophalen ---
  useEffect(() => {
    if (!competitionId) return;
    fetchWeather();
  }, [competitionId]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${competitionId}/weather`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Kon weer niet ophalen');
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoadingWeather(false);
    }
  };

  // --- Mutaties ---
  const deleteMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      toast.success('Wedstrijd verwijderd');
      navigate('/competitions');
    },
    onError: (err: Error) => toast.error(`Verwijderen mislukt: ${err.message}`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateCompetitionStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
  });

  const addParticipantMutation = useMutation({
    mutationFn: ({ competitionId, name, number }: { competitionId: number; name: string; number?: number }) =>
      addParticipant(competitionId, name, number),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
  });

  const addCatchMutation = useMutation({
    mutationFn: ({ participantId, catchData }: { participantId: number; catchData: { species: string; weight: number } }) =>
      addCatch(participantId, catchData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => patchCompetition(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
  });

  const randomAssignMutation = useMutation({
    mutationFn: (competitionId: number) => assignNumbersRandomly(competitionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
  });

  // --- Loading / error ---
  if (isNaN(competitionId)) return <p>Ongeldige wedstrijd ID</p>;
  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fout bij ophalen: {(error as Error).message}</p>;
  if (!competition) return <p>Wedstrijd niet gevonden</p>;

  // --- Data voorbereiding ---
  const status = statusConfig[competition.status];
  const dateStr = new Date(competition.date).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const ranked = [...(competition.participants ?? [])].map(p => ({ ...p, total: getTotalWeight(p) })).sort((a, b) => b.total - a.total);

  // --- Handlers ---
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

  const handleAddCatch = (participantId: number) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const weight = Number(form.get('weight'));
    if (!weight) return;
    addCatchMutation.mutate({ participantId, catchData: { species: '', weight } });
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/competitions">
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Link>
      </Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
          <p className="text-sm text-muted-foreground">{dateStr} — {competition.location}</p>
        </div>
        <div className="flex gap-2">
          {competition.status === 'upcoming' && <Button size="sm" onClick={() => handleStatusChange('active')}>Start</Button>}
          {competition.status === 'active' && <Button size="sm" onClick={() => handleStatusChange('completed')}>Beëindig</Button>}
          <Button size="sm" variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {/* Deelnemers */}
      <Card>
        <CardHeader>
          <CardTitle>Deelnemers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead className="text-right">Totaal Gewicht</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right font-mono">{formatWeight(p.total)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Plus className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Gewicht toevoegen: {p.name}</DialogTitle></DialogHeader>
                        <form onSubmit={handleAddCatch(p.id)}>
                          <div className="space-y-2">
                            <Label htmlFor="weight">Gewicht</Label>
                            <Input id="weight" name="weight" type="number" required autoFocus />
                          </div>
                          <Button type="submit" className="w-full mt-2">Toevoegen</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-3" size="sm"><UserPlus className="mr-2 h-4 w-4" />Deelnemer toevoegen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nieuwe deelnemer</DialogTitle></DialogHeader>
              <form onSubmit={handleAddParticipant}>
                <div className="space-y-2">
                  <Label htmlFor="name">Naam</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Nummer (optioneel)</Label>
                  <Input id="number" name="number" type="number" min="1" />
                </div>
                <Button type="submit" className="w-full mt-2">Toevoegen</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
