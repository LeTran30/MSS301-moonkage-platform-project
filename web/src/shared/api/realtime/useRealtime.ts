import { useContext } from 'react';
import { RealtimeContext, type RealtimeContextValue } from './realtimeContext';

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
