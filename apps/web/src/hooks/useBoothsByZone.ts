import { GetBoothsByZoneResponse } from '@kamf/interface/types/api.js';
import { Zone } from '@kamf/interface/types/festival.js';
import { useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

export function useBoothsByZone(zone: Zone) {
  return useSuspenseQuery({
    queryKey: ['booths', 'zone', zone],
    queryFn: () => apiClient<GetBoothsByZoneResponse>(`booths/zone/${zone}`),
  });
}
