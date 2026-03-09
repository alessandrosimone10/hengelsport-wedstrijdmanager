import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompetition } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function NewCompetition() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
  name: '', date: '', location: '', entryFee: '', numbers: '', maxParticipants: '',
  startTime: '', endTime: ''   // nieuw
});});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.location) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setIsSubmitting(true);

    // Data voorbereiden voor backend (underscores)
    const entry_fee = form.entryFee ? Number(form.entryFee) : undefined;
    const available_numbers = form.numbers
      ? form.numbers.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n) && n > 0)
      : undefined;

    try {
  const newCompetition = await createCompetition({
  name: form.name,
  date: form.date,
  location: form.location,
  entry_fee: entryFee,
  available_numbers: availableNumbers,
  max_participants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
  start_time: form.startTime || undefined,
  end_time: form.endTime || undefined,
});
      toast.success('Wedstrijd aangemaakt!');
      navigate(`/competitions/${newCompetition.id}`);
    } catch (error) {
      toast.error('Aanmaken mislukt: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/competitions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Trophy className="h-5 w-5 text-primary" />
            Nieuwe wedstrijd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                placeholder="bijv. Clubkampioenschap 2026"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Locatie</Label>
              <Input
                id="location"
                placeholder="bijv. Amstel, Amsterdam"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryFee">Inschrijfgeld (€, optioneel)</Label>
              <Input
                id="entryFee"
                type="number"
                min="0"
                step="0.50"
                placeholder="bijv. 10"
                value={form.entryFee}
                onChange={e => setForm(f => ({ ...f, entryFee: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numbers">Beschikbare nummers (optioneel)</Label>
              <Textarea
                id="numbers"
                placeholder="bijv. 1, 5, 8, 12, 19, 22, 35, 41, 46, 51, 54"
                value={form.numbers}
                onChange={e => setForm(f => ({ ...f, numbers: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Voer de beschikbare peknummers in. Bij het toevoegen van deelnemers worden deze willekeurig verdeeld.
              </p>
            </div>
            {/* Maximum deelnemers */}
          <div className="space-y-2">
        <Label htmlFor="maxParticipants">Maximaal aantal deelnemers (optioneel)</Label>
      <Input
      id="maxParticipants"
      type="number"
      min="1"
      placeholder="bijv. 20"
      value={form.maxParticipants}
      onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))}
    />
  <p className="text-xs text-muted-foreground">
    Laat leeg voor onbeperkt.
  </p>
</div>
            <div className="space-y-2">
  <Label htmlFor="startTime">Starttijd (optioneel, bijv. 14:00)</Label>
  <Input
    id="startTime"
    type="time"
    value={form.startTime}
    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
  />
</div>
<div className="space-y-2">
  <Label htmlFor="endTime">Eindtijd (optioneel)</Label>
  <Input
    id="endTime"
    type="time"
    value={form.endTime}
    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
  />
</div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Bezig...' : 'Wedstrijd aanmaken'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
