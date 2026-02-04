import { useGetCallerUserProfile } from './useQueries';
import { AccountType } from '../backend';

export function useAccountType() {
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();

  const accountType = userProfile?.accountType;

  return {
    accountType,
    isClient: accountType === AccountType.client,
    isWorker: accountType === AccountType.worker,
    hasAccountType: !!accountType,
    isLoading,
    isFetched,
  };
}
