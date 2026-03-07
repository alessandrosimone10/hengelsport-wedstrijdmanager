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

// Hulpfunctie voor standaard prijspercentages
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const competitionId = Number(id);

  // ----- Weer state -----
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // ----- Query: competitie ophalen -----
  const {
    data: competition,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => fetchCompetition(competitionId),
    enabled: !isNaN(competitionId),
  });

  // ----- Weer ophalen zodra competitie geladen is -----
  useEffect(() => {
    if (competition) {
      fetchWeather();
    }
  }, [competition]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/weather`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Weer niet beschikbaar voor deze locatie');
        }
        throw new Error('Kon weer niet ophalen');
      }
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setWeatherError(err.message);
      console.error('Weer fout:', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  // ----- Mutaties -----
  const deleteMutation = useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => {
      toast.success('Wedstrijd verwijderd');
      navigate('/competitions');
    },
    onError: (err: Error) => toast.error(`Verwijderen mislukt: ${err.message}`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateCompetitionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Status bijgewerkt');
    },
    onError: (err: Error) => toast.error(`Status wijzigen mislukt: ${err.message}`),
  });

  const addParticipantMutation = useMutation({
    mutationFn: ({ competitionId, name, number }: { competitionId: number; name: string; number?: number }) =>
      addParticipant(competitionId, name, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Deelnemer toegevoegd');
    },
    onError: (err: Error) => toast.error(`Toevoegen mislukt: ${err.message}`),
  });

  const addCatchMutation = useMutation({
    mutationFn: ({
      participantId,
      catchData,
    }: {
      participantId: number;
      catchData: { species: string; weight: number; time?: string };
    }) => addCatch(participantId, catchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Vangst geregistreerd');
    },
    onError: (err: Error) => toast.error(`Vangst toevoegen mislukt: ${err.message}`),
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => patchCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Instellingen opgeslagen');
    },
    onError: (err: Error) => toast.error(`Opslaan mislukt: ${err.message}`),
  });

  const randomAssignMutation = useMutation({
    mutationFn: (competitionId: number) => assignNumbersRandomly(competitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      toast.success('Nummers willekeurig verdeeld!');
    },
    onError: (err: Error) => toast.error(`Toewijzen mislukt: ${err.message}`),
  });

  // ----- Loading / error states -----
  if (isNaN(competitionId)) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Ongeldige wedstrijd ID.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/competitions">Terug naar overzicht</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500">
        <p>Fout bij ophalen: {error.message}</p>
        <p>Controleer de console voor meer details.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/competitions">Terug naar overzicht</Link>
        </Button>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Wedstrijd niet gevonden (geen data).</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/competitions">Terug naar overzicht</Link>
        </Button>
      </div>
    );
  }

  // ----- Data voorbereiding -----
  const status = statusConfig[competition.status];
  const dateStr = new Date(competition.date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Ranking
  const ranked = [...competition.participants]
    .map(p => ({ ...p, total: getTotalWeight(p) }))
    .sort((a, b) => b.total - a.total);

  // Prijzenpot berekening
  const entryFee = competition.entry_fee ?? 0;
  const calculatedPot = entryFee * competition.participants.length;
  const prizePot = competition.custom_prize_pot ?? calculatedPot;
  const fishFundPct = competition.fish_fund_percentage ?? 25;
  const fishFundAmount = prizePot * (fishFundPct / 100);
  const distributablePot = prizePot - fishFundAmount;
  const prizeWinners = competition.prize_distribution ?? Math.min(3, competition.participants.length);
  const prizePercentages = competition.prize_percentages ?? getDefaultPercentages(prizeWinners);
  const prizeAmounts = prizePercentages.map(pct => distributablePot * (pct / 100));

  // ----- Handlers -----
  const handleAddParticipant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const number = form.get('number') as string;
    if (!name.trim()) return;
    addParticipantMutation.mutate({
      competitionId,
      name: name.trim(),
      number: number ? Number(number) : undefined,
    });
    e.currentTarget.reset();
  };

  const handleRandomAssign = () => {
    randomAssignMutation.mutate(competitionId);
  };

  const handleAddCatch = (participantId: number) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const weight = Number(form.get('weight'));
    if (!weight) return;
    addCatchMutation.mutate({
      participantId,
      catchData: { species: '', weight, time: '' },
    });
    e.currentTarget.reset();
  };

  const handleDelete = () => {
    deleteMutation.mutate(competitionId);
  };

  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate({ id: competitionId, status: newStatus });
  };

  const handleUpdateEntryFee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fee = Number(form.get('entry_fee'));
    const customPot = form.get('custom_prize_pot') as string;
    updateCompetitionMutation.mutate({
      id: competitionId,
      data: {
        entry_fee: fee,
        custom_prize_pot: customPot ? Number(customPot) : undefined,
      },
    });
  };

  const handleUpdatePrizeDistribution = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const count = Number(form.get('prizeCount'));
    if (count < 1) return;
    const fishPct = Number(form.get('fishFundPct') ?? 25);
    const percentages: number[] = [];
    for (let i = 0; i < count; i++) {
      percentages.push(Number(form.get(`pct_${i}`) ?? 0));
    }
    const totalPct = percentages.reduce((s, v) => s + v, 0);
    if (totalPct !== 100) {
      toast.error(`Percentages moeten optellen tot 100% (nu ${totalPct}%)`);
      return;
    }
    updateCompetitionMutation.mutate({
      id: competitionId,
      data: {
        prize_distribution: count,
        prize_percentages: percentages,
        fish_fund_percentage: fishPct,
      },
    });
  };

  const handleUpdateAvailableNumbers = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = form.get('available_numbers') as string;
    const numbers = input.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    updateCompetitionMutation.mutate({
      id: competitionId,
      data: { available_numbers: numbers },
    });
  };

  const handleExportCSV = () => {
    const totalCatches = competition.participants.reduce((s, p) => s + p.catches.length, 0);
    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<title>${competition.name} — Uitslag</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f0f4f8; color: #1a202c; padding: 40px 20px; }
  .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%); color: #fff; padding: 40px 32px 28px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .header .meta { display: flex; gap: 24px; flex-wrap: wrap; font-size: 14px; opacity: 0.9; }
  .header .meta span { display: flex; align-items: center; gap: 6px; }
  .body { padding: 32px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 28px; }
  .stat { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
  .stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #718096; margin-bottom: 4px; }
  .stat .value { font-size: 22px; font-weight: 700; color: #1e3a5f; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th { background: #f7fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #718096; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
  tr:hover td { background: #f7fafc; }
  .pos { font-weight: 700; width: 50px; }
  .pos-1 { color: #d4a017; }
  .pos-2 { color: #718096; }
  .pos-3 { color: #b7791f; }
  .weight { font-family: 'Courier New', monospace; font-weight: 600; text-align: right; }
  .prize-row { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 8px; margin-bottom: 4px; font-size: 14px; }
  .prize-row:nth-child(odd) { background: #f7fafc; }
  .prize-amount { font-family: 'Courier New', monospace; font-weight: 700; color: #2d6a4f; }
  .footer { background: #f7fafc; padding: 16px 32px; font-size: 12px; color: #a0aec0; text-align: center; border-top: 1px solid #e2e8f0; }
  .medal { font-size: 18px; margin-right: 4px; }
  @media print { body { background: #fff; padding: 0; } .container { box-shadow: none; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏆 ${competition.name}</h1>
    <div class="meta">
      <span>📅 ${dateStr}</span>
      <span>📍 ${competition.location}</span>
      <span>👥 ${competition.participants.length} deelnemers</span>
    </div>
  </div>
  <div class="body">
    <div class="stats">
      <div class="stat"><div class="label">Deelnemers</div><div class="value">${competition.participants.length}</div></div>
      <div class="stat"><div class="label">Totaal vangsten</div><div class="value">${totalCatches}</div></div>
      ${prizePot > 0 ? `<div class="stat"><div class="label">Prijzenpot</div><div class="value">€${prizePot.toFixed(2)}</div></div>` : ''}
      ${fishFundAmount > 0 ? `<div class="stat"><div class="label">Visfonds (${fishFundPct}%)</div><div class="value">€${fishFundAmount.toFixed(2)}</div></div>` : ''}
    </div>

    <h2>Klassement</h2>
    <table>
      <thead><tr><th>Pos</th><th>Nr</th><th>Naam</th><th style="text-align:right">Gewicht</th></tr></thead>
      <tbody>
        ${ranked.map((p, i) => {
          const medal = i === 0 ? '<span class="medal">🥇</span>' : i === 1 ? '<span class="medal">🥈</span>' : i === 2 ? '<span class="medal">🥉</span>' : '';
          return `<tr><td class="pos pos-${i + 1}">${medal}${i + 1}</td><td>${p.number ?? '—'}</td><td>${p.name}</td><td class="weight">${formatWeight(p.total)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>

    ${distributablePot > 0 ? `
    <h2>Prijzenverdeling</h2>
    <div>
      ${prizePercentages.map((pct, i) => {
        const winner = ranked[i]?.name ?? '—';
        const amount = distributablePot * (pct / 100);
        return `<div class="prize-row"><span><strong>#${i + 1}</strong> — ${winner} <span style="color:#a0aec0;font-size:12px">(${pct}%)</span></span><span class="prize-amount">€${amount.toFixed(2)}</span></div>`;
      }).join('')}
    </div>` : ''}
  </div>
  <div class="footer">
    Gegenereerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — Hengelsport Wedstrijdmanager
  </div>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${competition.name.replace(/\s+/g, '_')}_uitslag.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Uitslag geëxporteerd als HTML');
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/competitions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Link>
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-display">{competition.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {dateStr}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {competition.location}
            </span>
            {entryFee > 0 && (
              <span className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" /> €{entryFee.toFixed(2)} p.p.
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {competition.status === 'upcoming' && (
            <Button size="sm" onClick={() => handleStatusChange('active')}>Start wedstrijd</Button>
          )}
          {competition.status === 'active' && (
            <Button size="sm" onClick={() => handleStatusChange('completed')}>Beëindig wedstrijd</Button>
          )}
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Weer info */}
      {weather && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {weather.condition_code === 'sun' && <Sun className="h-10 w-10 text-yellow-500" />}
                {weather.condition_code === 'cloud' && <Cloud className="h-10 w-10 text-gray-500" />}
                {weather.condition_code === 'rain' && <CloudRain className="h-10 w-10 text-blue-500" />}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Huidig weer</p>
                  <p className="text-2xl font-bold">{weather.temperature}°C</p>
                  <p className="text-sm">{weather.condition}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span>{weather.wind_speed} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span>{weather.humidity}%</span>
                </div>
              </div>
            </div>
           <p className="text-xs text-muted-foreground mt-2">
           Bijgewerkt: {weather.updated_at ? (() => {
            const date = new Date(weather.updated_at);
          return isNaN(date.getTime()) ? 'onbekend' : date.toLocaleTimeString('nl-NL');
          })() : 'onbekend'}
          </p>
          </CardContent>
        </Card>
      )}

      {loadingWeather && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Weer laden...</p>
          </CardContent>
        </Card>
      )}

      {weatherError && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <p className="text-yellow-700 dark:text-yellow-300 text-center">
              ⚠️ Kon weer niet laden: {weatherError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prijzenpot */}
      {competition.participants.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Coins className="h-5 w-5 text-primary" />
              Prijzenpot
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Instellingen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Prijzenpot instellingen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateEntryFee} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry_fee">Inschrijfgeld (€)</Label>
                    <Input id="entry_fee" name="entry_fee" type="number" min="0" step="0.50" defaultValue={entryFee} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_prize_pot">Eigen prijzenpot (€) <span className="text-xs text-muted-foreground">— leeg = automatisch</span></Label>
                    <Input id="custom_prize_pot" name="custom_prize_pot" type="number" min="0" step="0.50" defaultValue={competition.custom_prize_pot ?? ''} placeholder={`Auto: €${calculatedPot.toFixed(2)}`} />
                  </div>
                  <Button type="submit" className="w-full">Opslaan</Button>
                </form>
                <form onSubmit={handleUpdatePrizeDistribution} className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fishFundPct">Visfonds percentage (%)</Label>
                    <Input id="fishFundPct" name="fishFundPct" type="number" min="0" max="100" defaultValue={fishFundPct} />
                    <p className="text-xs text-muted-foreground">Wordt afgehouden voor aankoop vis voor de vijver.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prizeCount">Aantal prijswinnaars</Label>
                    <Input
                      id="prizeCount"
                      name="prizeCount"
                      type="number"
                      min="1"
                      max={competition.participants.length}
                      defaultValue={prizeWinners}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        const container = e.currentTarget.form?.querySelector('#pct-fields');
                        if (container) {
                          const defaults = getDefaultPercentages(count);
                          container.innerHTML = '';
                          defaults.forEach((pct, i) => {
                            const div = document.createElement('div');
                            div.className = 'flex items-center gap-2';
                            div.innerHTML = `<span class="text-sm w-16">#${i + 1}</span><input name="pct_${i}" type="number" min="0" max="100" value="${pct}" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><span class="text-sm">%</span>`;
                            container.appendChild(div);
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verdeling per positie (%)</Label>
                    <div id="pct-fields" className="space-y-2">
                      {prizePercentages.map((pct, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm w-16">#{i + 1}</span>
                          <Input name={`pct_${i}`} type="number" min="0" max="100" defaultValue={pct} />
                          <span className="text-sm">%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Moet optellen tot 100%.</p>
                  </div>
                  <Button type="submit" className="w-full">Opslaan</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Totale pot</p>
                <p className="text-xl font-bold font-mono">€{prizePot.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Visfonds ({fishFundPct}%)</p>
                <p className="text-xl font-bold font-mono text-blue-600">€{fishFundAmount.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Te verdelen</p>
                <p className="text-xl font-bold font-mono">€{distributablePot.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Winnaars</p>
                <p className="text-xl font-bold font-mono">{prizeWinners}</p>
              </div>
            </div>
            {/* Prijsverdeling */}
            <div className="mt-4 space-y-1">
              <p className="text-sm font-semibold">Prijzenverdeling:</p>
              {prizePercentages.map((pct, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                  <span>
                    <span className="font-mono font-semibold mr-2">#{i + 1}</span>
                    {competition.status === 'completed' && ranked[i] ? ranked[i].name : '—'}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">{pct}%</span>
                    <span className="font-mono font-semibold text-primary">€{prizeAmounts[i]?.toFixed(2)}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Klassement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Klassement
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {ranked.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            {competition.participants.length > 0 && competition.available_numbers && competition.available_numbers.length >= competition.participants.length && (
              <Button size="sm" variant="outline" onClick={handleRandomAssign}>
                <Shuffle className="mr-2 h-4 w-4" />
                Loot nummers
              </Button>
            )}
            {/* Beschikbare nummers instellen */}
            {competition.participants.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Hash className="mr-2 h-4 w-4" />
                    Nummers
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nummerbeheer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateAvailableNumbers} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="available_numbers">Beschikbare nummers</Label>
                      <Textarea
                        id="available_numbers"
                        name="available_numbers"
                        placeholder="bijv. 1, 5, 8, 12, 19, 22, 35"
                        defaultValue={competition.available_numbers?.join(', ') ?? ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Stel de beschikbare peknummers in. Met "Loot nummers" worden ze willekeurig verdeeld.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" variant="outline">Nummers opslaan</Button>
                  </form>
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Huidige nummers</p>
                    <div className="text-xs text-muted-foreground space-y-1 rounded-lg bg-muted p-3 mb-3">
                      {competition.participants.map((p, i) => (
                        <div key={p.id}>{i + 1}. {p.name} → {p.number ?? '...'}</div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Deelnemer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deelnemer toevoegen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddParticipant} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pname">Naam</Label>
                    <Input id="pname" name="name" placeholder="Naam deelnemer" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pnumber">Nummer (optioneel)</Label>
                    <Input id="pnumber" name="number" type="number" min="1" placeholder="bijv. 8" />
                  </div>
                  <Button type="submit" className="w-full">Toevoegen</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              Nog geen deelnemers. Voeg deelnemers toe om te beginnen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-16">Nr.</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="text-right">Gewicht</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-semibold text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.number ?? '—'}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatWeight(p.total)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Fish className="h-5 w-5 text-primary" />
                              Gewicht voor {p.name}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleAddCatch(p.id)} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="weight">Gewicht (gram)</Label>
                              <Input id="weight" name="weight" type="number" min="1" placeholder="bijv. 3500" required autoFocus />
                            </div>
                            <Button type="submit" className="w-full">Registreren</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vangsten overzicht */}
      {ranked.filter(p => p.catches.length > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Fish className="h-5 w-5 text-primary" />
              Vangsten overzicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ranked.filter(p => p.catches.length > 0).map(p => (
              <div key={p.id}>
                <h4 className="mb-2 font-semibold text-sm">{p.name}</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {p.catches.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{c.species}</span>
                        <span className="ml-2 text-muted-foreground">{c.time}</span>
                      </div>
                      <span className="font-mono font-semibold">{formatWeight(c.weight)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
