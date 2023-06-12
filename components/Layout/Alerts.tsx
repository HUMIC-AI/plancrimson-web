import { onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import Firestore from '@/src/schema';
import { FaTimes } from 'react-icons/fa';
import { useMounted } from '@/src/utils/hooks';

export default function () {
  const mounted = useMounted();
  if (!mounted) return null;
  return <Alerts />;
}

function Alerts() {
  const { alerts, dismiss } = useAlerts();

  return (
    <>
      {alerts.map((alert) => (
        <div key={alert} className="flex items-center justify-center bg-yellow text-black">
          {alert}
          <button
            type="button"
            className="interactive ml-2 px-2 py-1"
            onClick={() => dismiss(alert)}
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </>
  );
}

// only called client side
function useAlerts() {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    const values = localStorage.getItem('alerts');
    if (values) {
      const a = JSON.parse(values);
      if (Array.isArray(a) && a.every((v) => typeof v === 'string')) {
        return a;
      }
    }
    return [];
  });

  useEffect(() => onSnapshot(
    Firestore.Collection.alerts(),
    (snap) => setAlerts(snap.docs.map((doc) => doc.data().alert)),
    (err) => {
      console.error('an error occurred when fetching alerts', err);
    },
  ), []);

  useEffect(() => {
    localStorage.setItem('alerts', JSON.stringify(dismissed));
  }, [dismissed]);

  const dismiss = (alert: string) => setDismissed((prev) => [...prev, alert]);

  const newAlerts = useMemo(() => alerts.filter((alert) => !dismissed.includes(alert)), [alerts, dismissed]);

  return { alerts: newAlerts, dismiss };
}
