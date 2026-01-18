import { useState, useEffect } from "react";

// Este hook retrasa la actualización de un valor hasta que pase el tiempo especificado
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configuramos un temporizador
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si el valor cambia antes de que termine el tiempo (el usuario sigue escribiendo),
    // limpiamos el temporizador anterior y empezamos uno nuevo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}