import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Users, Cloud, Fish, Clock } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://hengelsport-wedstrijdmanager.onrender.com";

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

function WeatherIcon({ compId }: { compId: number }) {
  const { data } = useQuery({
    queryKey: ['weather', compId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/competitions/${compId}/weather`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 600000,
  });

  if (!data) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Cloud className="h-4 w-4" />
      {data.temperature}°C
    </div>
  );
};

export default function PublicCompetitions() {
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['public-competitions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/public/competitions`);
      if (!res.ok) throw new Error('Ophalen mislukt');
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center">Laden...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Fout: {error.message}</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Fish className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display">VisWedstrijd</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Status
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Inloggen
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Beschikbare wedstrijden</h1>
        {competitions.length === 0 ? (
          <p>Er zijn momenteel geen wedstrijden.</p>
        ) : (
          <div className="grid gap-6">
            {competitions.map((comp) => {
              const status = statusConfig[comp.status] || { label: comp.status, variant: 'secondary' };
              const dateStr = new Date(comp.date).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const available = comp.max_participants ? comp.max_participants - comp.current_participants : null;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.location)}`;

              return (
                <Card key={comp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">{comp.name}</CardTitle>
                        <Badge variant={status.variant} className="mt-1">{status.label}</Badge>
                      </div>
                     <WeatherIcon compId={comp.id} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{dateStr}</span>
                    </div>
                   {comp.start_time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="font-medium">
                  {comp.start_time.slice(0,5)}
                  {comp.end_time && ` - ${comp.end_time.slice(0,5)}`}
                  </span>
                  </div>
                  )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {comp.location}
                      </a>
               </div>
               <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {comp.current_participants} deelnemer
                  {comp.current_participants !== 1 ? 's' : ''}
                </span>
              </div>

              {comp.max_participants && (
              <Badge variant="outline">
              {comp.current_participants}/{comp.max_participants}
              </Badge>
              )}
            </div>
                    {comp.entry_fee > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4 shrink-0" />
                        <span>€ {comp.entry_fee.toFixed(2)} p.p.</span>
                      </div>
                    )}

                    {available !== null && (
                      <div className="mt-2">
                        {available <= 0 ? (
                         <Badge variant="destructive">Volzet</Badge>
                        ) : (
                          <p className="text-sm text-green-600 font-medium">
                            Nog {available} plaats{available !== 1 ? 'en' : ''} vrij
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button asChild className="w-full">
                        <Link to={`/meedoen/${comp.id}`}>
                          Inschrijven
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
