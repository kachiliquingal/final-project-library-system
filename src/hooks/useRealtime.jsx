import { useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';

export const useRealtime = (tableName, onChange, events = ['INSERT', 'UPDATE', 'DELETE']) => {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const uniqueChannelId = `${tableName}-${Math.random().toString(36).substr(2, 9)}`;

    const channel = supabase
      .channel(uniqueChannelId) 
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (events.includes(payload.eventType)) {
            onChangeRef.current(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]); 
};