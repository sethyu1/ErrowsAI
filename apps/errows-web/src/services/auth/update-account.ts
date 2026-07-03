import { useMutation } from '@tanstack/react-query';
import { useShallow } from "zustand/react/shallow";
import { updateProfileApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';

export function useUpdateAccount() {
  const { setUser } = useAuthStore(useShallow((state) => ({
    setUser: state.setUser,
  })));

  const {
    error,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (_, variables) => {
      const { gender, name } = variables;
      const user = useAuthStore.getState().user;

      setUser({
        ...user,
        name,
        profile: {
          ...user?.profile,
          gender,
        }
      } as API.User.Info)
    }
  });

  return {
    loading,
    error,
    updateAccount: mutateAsync
  }
}
