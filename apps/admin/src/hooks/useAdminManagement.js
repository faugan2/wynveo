import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../services/index.js';

export function useAdmins() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.listAdmins();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, error };
}

export function useAdminActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createAdmin = useCallback(async (email, role) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.createAdmin(email, role);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteAdmin = useCallback(async (adminId) => {
    setLoading(true);
    setError(null);
    try {
      await adminService.deleteAdmin(adminId);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const updateAdminRole = useCallback(async (adminId, newRole) => {
    setLoading(true);
    setError(null);
    try {
      await adminService.updateAdminRole(adminId, newRole);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { createAdmin, deleteAdmin, updateAdminRole, loading, error };
}
