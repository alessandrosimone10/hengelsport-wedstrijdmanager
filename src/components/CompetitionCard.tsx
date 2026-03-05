import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { Competition } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  upcoming: { label: 'Gepland', variant: 'secondary' as const },
  active: { label: 'Actief', variant: 'default' as const },
  completed: { label: 'Afgelopen', variant: 'outline' as const },
};

interface CompetitionCardProps {
  competition: Competition;
  index?: number;
}

export default function CompetitionCard({ competition, index = 0 }: CompetitionCardProps) {
  const status = statusConfig[competition.status];
  const dateStr = new Date(competition.date).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/competitions/${competition.id}`}
        className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold font-display truncate">{competition.name}</h3>
            <Badge variant={status.variant} className="shrink-0 text-xs">
              {status.label}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {competition.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {competition.participants.length} deelnemers
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
