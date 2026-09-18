import { useEffect, useState } from 'react';
import { remainingLabel } from '../../lib/format';

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState(() => remainingLabel(expiresAt));
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      setLabel(remainingLabel(expiresAt));
      const ms = Date.parse(expiresAt) - Date.now();
      setUrgent(ms > 0 && ms < 60 * 60 * 1000);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return <span className={`tabular ${urgent ? 'text-amber-200' : ''}`}>{label}</span>;
}
