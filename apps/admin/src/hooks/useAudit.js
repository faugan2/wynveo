import { useEffect, useState } from 'react';
import { adminService } from '../services/index.js';

export function useAuditLogs(options = {}) {
  const [logs, setLogs] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [logsData, statsData] = await Promise.all([
          adminService.getAuditLogs(options),
          adminService.getAuditStats(),
        ]);
        setLogs(logsData);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [options.adminFilter, options.actionFilter]);

  return { logs, stats, loading, error };
}
