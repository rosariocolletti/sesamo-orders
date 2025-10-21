import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';

const ADMIN_EMAILS = [
  'rosario.colletti@gmail.com',
  'sesamobrno@gmail.com',
  'sesamosales@gmail.com'
];

export type UserRole = 'admin' | 'client' | 'unauthorized' | 'loading';

interface UserRoleData {
  role: UserRole;
  clientData?: Client;
  userEmail?: string;
}

export function useUserRole(): UserRoleData {
  const [roleData, setRoleData] = useState<UserRoleData>({ role: 'loading' });

  useEffect(() => {
    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      (async () => {
        await checkUserRole();
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setRoleData({ role: 'unauthorized' });
        return;
      }

      const userEmail = user.email.toLowerCase();

      if (ADMIN_EMAILS.includes(userEmail)) {
        setRoleData({ role: 'admin', userEmail });
        return;
      }

      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Error checking client status:', error);
        setRoleData({ role: 'unauthorized', userEmail });
        return;
      }

      if (clientData) {
        const client: Client = {
          id: clientData.id,
          name: clientData.name,
          address: clientData.address,
          vat: clientData.vat,
          phone: clientData.phone,
          email: clientData.email,
          notes: clientData.notes || '',
          createdAt: clientData.created_at || new Date().toISOString()
        };

        setRoleData({ role: 'client', clientData: client, userEmail });
        return;
      }

      setRoleData({ role: 'unauthorized', userEmail });
    } catch (err) {
      console.error('Error in checkUserRole:', err);
      setRoleData({ role: 'unauthorized' });
    }
  };

  return roleData;
}
