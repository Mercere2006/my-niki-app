import { useEffect, useState } from 'react';
import { readGameValue, writeGameValue } from '../services/gamePersistence';

export function useGameState(key, initialValue, restore = (value) => value) {
  const [value, setValue] = useState(() => restore(readGameValue(key, typeof initialValue === 'function' ? initialValue() : initialValue)));
  useEffect(() => { writeGameValue(key, value); }, [key, value]);
  return [value, setValue];
}
