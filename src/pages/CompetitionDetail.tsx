// CompetitionDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCompetition,
  updateCompetitionStatus,
  addParticipant,
  addCatch,
  deleteCompetition,
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
import { ArrowLeft, Calendar, Coins, Download, Fish, Hash, Plus, Shuffle, Trash2, Trophy, UserPlus, MapPin, Wind, Droplets, Cloud, CloudRain, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const getWeatherIcon = (code?: string) => {
  if (!code) return <Cloud className="h-10 w-10 text-gray-400" />;
  const c = code.toLowerCase();
  if (c.includes("sun") || c.includes("clear")) return <Sun className="h-10 w-10 text-yellow-500" />;
  if (c.includes("cloud")) return <Cloud className="h-10 w-10 text-gray-500" />;
  if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className="h-10 w-10 text-blue-500" />;
  return <Cloud className="h-10 w-10 text-gray-400" />;
};

function getDefaultPercentages(count: number): number[] {
  if (count === 1) return [100];
  if (count === 2) return [60, 40];
  if (count === 3) return [50, 30, 20];
  const base = Math.floor(100 / count);
  const rest = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rest ? 1 : 0));
}

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const competitionId = Number(id);

  // --- Weather state ---
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // --- Fetch competition ---
  const { data: competition, isLoading, error } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => fetchCompetition(competitionId),
    enabled: !isNaN(competitionId),
  });

  // --- Fetch weather ---
  useEffect(() => {
    if (!competitionId) return;
    fetchWeather();
  }, [competitionId]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/competitions/${competitionId}/weather`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Kon weer niet ophalen');
      const data = await response.json();
      setWeather(data);
    } catch (err: any) {
      setWeatherError(err.message || 'Onbekende fout');
    } finally {
      setLoadingWeather(false);
    }
  };

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      toast.success('Wedstrijd verwijderd');
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      navigate('/competitions');
    },
    onError: (err: any) => toast.error(err.message || 'Verwijderen mislukt'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateCompetitionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Status bijgewerkt');
    },
    onError: (err: any) => toast.error(`Status wijzigen mislukt: ${err.message}`),
  });

  const addParticipantMutation = useMutation({
    mutationFn: ({ competitionId, name, number }: { competitionId: number; name: string; number?: number }) =>
      addParticipant(competitionId, name, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Deelnemer toegevoegd');
    },
    onError: (err: any) => toast.error(`Toevoegen mislukt: ${err.message}`),
  });

  const addCatchMutation = useMutation({
    mutationFn: ({ participantId, catchData }: { participantId: number; catchData: { species: string; weight: number; time?: string } }) =>
      addCatch(participantId, catchData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', competitionId] }),
    onError: (err: any) => toast.error(`Vangst toevoegen mislukt: ${err.message}`),
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => patchCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Instellingen opgeslagen');
    },
    onError: (err: any) => toast.error(`Opslaan mislukt: ${err.message}`),
  });

  const randomAssignMutation = useMutation({
    mutationFn: (competitionId: number) => assignNumbersRandomly(competitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Nummers willekeurig verdeeld!');
    },
    onError: (err: any) => toast.error(`Toewijzen mislukt: ${err.message}`),
  });

  // --- Loading/error handling ---
  if (isNaN(competitionId)) return <p>Ongeldige ID</p>;
  if (isLoading) return <p>Laden...</p>;
  if (error) return <p>Fout: {(error as Error).message}</p>;
  if (!competition) return <p>Wedstrijd niet gevonden</p>;

  // --- Data prep ---
  const status = statusConfig[competition.status];
  const dateStr = new Date(competition.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const ranked = competition.participants
    ? [...competition.participants].map(p => ({ ...p, total: getTotalWeight(p) })).sort((a, b) => b.total - a.total)
    : [];

  const entryFee = competition.entry_fee ?? 0;
  const calculatedPot = entryFee * competition.participants.length;
  const prizePot = competition.custom_prize_pot ?? calculatedPot;
  const fishFundPct = competition.fish_fund_percentage ?? 25;
  const fishFundAmount = prizePot * (fishFundPct / 100);
  const distributablePot = prizePot - fishFundAmount;
  const prizeWinners = competition.prize_distribution ?? Math.min(3, competition.participants.length);
  const prizePercentages = competition.prize_percentages ?? getDefaultPercentages(prizeWinners);
  const prizeAmounts = prizePercentages.map(pct => distributablePot * (pct / 100));

  // --- Handlers ---
  const handleDelete = async () => {
    if (!window.confirm('Weet je zeker dat je deze wedstrijd wilt verwijderen?')) return;
    try {
      await deleteMutation.mutateAsync(competitionId);
    } catch (err) { console.error(err); }
  };

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

  const handleRandomAssign = () => randomAssignMutation.mutate(competitionId);

  return (
    <div className="space-y-6">
      {/* Header + Delete */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-xl font-bold">{competition.name}</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleDelete}><Trash2 /> Verwijderen</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>Status: {competition.status}</p>
          <p>Locatie: {competition.location}</p>
          <p>Deelnemers: {competition.participants.length}</p>
        </CardContent>
      </Card>

      {/* Deelnemers tabel */}
      {ranked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Klassement</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="text-right">Gewicht</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{formatWeight(p.total)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Plus /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Vangst toevoegen</DialogTitle></DialogHeader>
                          <form onSubmit={handleAddCatch(p.id)}>
                            <Label htmlFor="weight">Gewicht (gram)</Label>
                            <Input id="weight" name="weight" type="number" min="1" required autoFocus />
                            <Button type="submit" className="w-full mt-2">Registreren</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Deelnemer toevoegen */}
      <Dialog>
        <DialogTrigger asChild>
          <Button><UserPlus /> Deelnemer</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Deelnemer toevoegen</DialogTitle></DialogHeader>
          <form onSubmit={handleAddParticipant}>
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" required />
            <Label htmlFor="number">Nummer (optioneel)</Label>
            <Input id="number" name="number" type="number" min="1" />
            <Button type="submit" className="w-full mt-2">Toevoegen</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
