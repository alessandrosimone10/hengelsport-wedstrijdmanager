import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Euro,
  Users,
  Cloud,
  Fish,
  Clock,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://hengelsport-wedstrijdmanager.onrender.com";

function getCountdown(date: string, start?: string) {
  if (!start) return null;

  const startDate = new Date(`${date}T${start}`);
  const now = new Date();
  const diff = startDate.getTime() - now.getTime();

  if (diff <= 0) return "🔴 Bezig of gestart";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `⏳ Start over ${days} dag(en)`;
  return `⏳ Start over ${hours} uur`;
}

function WeatherInfo({ compId }: { compId: number }) {
  const { data } = useQuery({
    queryKey: ["weather", compId],
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
}

export default function PublicCompetitions() {
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["public-competitions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/public/competitions`);
      if (!res.ok) throw new Error("Ophalen mislukt");
      return res.json();
    },
  });

  if (isLoading)
    return <div className="p-8 text-center">Wedstrijden laden...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Fish className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">VisWedstrijd</span>
          </Link>

          <Link to="/login">
            <Button variant="outline">Organisatie login</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <h1 className="text-3xl font-bold mb-6">
          🎣 Beschikbare viswedstrijden
        </h1>

        {competitions.length === 0 ? (
          <p>Er zijn momenteel geen wedstrijden gepland.</p>
        ) : (
          <div className="grid gap-6">
            {competitions.map((comp: any) => {
              const dateStr = new Date(comp.date).toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              const available = comp.max_participants
                ? comp.max_participants - comp.current_participants
                : null;

              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                comp.location
              )}`;

              const countdown = getCountdown(comp.date, comp.start_time);

              return (
                <Card
                  key={comp.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>{comp.name}</CardTitle>
                      <WeatherInfo compId={comp.id} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {dateStr}
                    </div>

                    {comp.start_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {comp.start_time.slice(0, 5)}
                        {comp.end_time && ` - ${comp.end_time.slice(0, 5)}`}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {comp.location}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {comp.current_participants} deelnemers
                      </div>

                      {comp.max_participants && (
                        <Badge variant="outline">
                          {comp.current_participants}/{comp.max_participants}
                        </Badge>
                      )}
                    </div>

                    {comp.entry_fee > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />€{" "}
                        {comp.entry_fee.toFixed(2)} p.p.
                      </div>
                    )}

                    {countdown && (
                      <div className="text-sm text-blue-600 font-medium">
                        {countdown}
                      </div>
                    )}

                    {available !== null && (
                      <div>
                        {available <= 0 ? (
                          <Badge variant="destructive">Volzet</Badge>
                        ) : (
                          <Badge variant="secondary">
                            {available} plaats
                            {available !== 1 ? "en" : ""} vrij
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button asChild className="w-full">
                      <Link to={`/meedoen/${comp.id}`}>
                        Inschrijven
                      </Link>
                    </Button>
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
