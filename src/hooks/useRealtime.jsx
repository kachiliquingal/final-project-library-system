import { useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

/**
 * Hook para escuchar cambios en tiempo real en una tabla de Supabase.
 * @param {string} tableName - Nombre de la tabla a escuchar (ej: 'books', 'loans')
 * @param {function} onChange - Función que se ejecuta cuando hay un cambio
 * @param {Array} events - Lista de eventos a escuchar (por defecto INSERT y UPDATE)
 */
export const useRealtime = (tableName, onChange, events = ['INSERT', 'UPDATE']) => {
  useEffect(() => {
    // 1. Configuramos el canal
    const channel = supabase
      .channel(`${tableName}-global-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          // Filtramos si el evento está en la lista que nos interesa
          if (events.includes(payload.eventType)) {
            // Ejecutamos la función que nos pasó el componente
            onChange(payload);
          }
        }
      )
      .subscribe();

    // 2. Limpieza al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, JSON.stringify(events)]); // Se recrea si cambian los parámetros
};