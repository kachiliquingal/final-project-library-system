import { QueryClient } from '@tanstack/react-query';

// Configuramos el cliente
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1. ¿Cuánto tiempo se considera la data "fresca"? 
      // Ponemos 5 minutos. Si vuelves a la pestaña en 2 min, no recarga de la BD, usa caché.
      staleTime: 1000 * 60 * 5, 
      
      // 2. ¿Cuánto tiempo guardamos la data en memoria si no se usa? (10 min)
      gcTime: 1000 * 60 * 10,

      // 3. REINTENTOS: Si falla la conexión, reintenta 3 veces antes de lanzar error
      retry: 3,
      
      // 4. IMPORTANTE PARA TU PROYECTO:
      // Esto permite trabajar offline. Si no hay red, usa lo que tengas en caché.
      networkMode: 'offlineFirst', 
    },
    mutations: {
        networkMode: 'offlineFirst',
    }
  },
});