import { getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Schema from 'shared/schema';

export default function Alerts() {
  const alerts = useAlerts();

  return <>{alerts.map((alert) => <div key={alert}>{alert}</div>)}</>;
}

function useAlerts() {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    getDocs(Schema.Collection.alerts())
      .then((snap) => setAlerts(snap.docs.map((doc) => doc.data().alert)))
      .catch((err) => {
        console.error('an error occurred when fetching alerts', err);
      });
  }, []);

  return alerts;
}
