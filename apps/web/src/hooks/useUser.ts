/**
 * User data management hooks
 */

import { GetUserResponse, UpdateUserResponse } from '@kamf/interface';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

// 내 정보 조회 hook
export function useMe() {
  return useSuspenseQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient<GetUserResponse>('users/me'),
  });
}

// 내 정보 수정 hook
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { displayName: string }) =>
      apiClient<UpdateUserResponse>('users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: response => {
      // 캐시 업데이트 - API 응답 구조가 이미 올바르므로 그대로 사용
      queryClient.setQueryData(['user', 'me'], response);
    },
  });
}
