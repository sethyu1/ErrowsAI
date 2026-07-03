import { ArrowRightIcon } from '@errows/icons';
import { Button } from '@errows/design/components/button';
import { useTranslation } from 'react-i18next';
import { useGlobalServer } from '@/hooks/use-global-server';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { createSubscriptionPortalApi } from '@/apis/payment';
import { useMutation } from '@tanstack/react-query';

export function Action() {
  const { setOpenChoosePlan } = useGlobalServer();
  const { t } = useTranslation();
  const { info: memberInfo } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));

  const { mutateAsync: createPortal } = useMutation({
    mutationFn: createSubscriptionPortalApi,
  });

  const handleClick = async () => {
    // Check if user has active subscription (not free, not cd-key plan, has subscription_id)
    const hasActiveSubscription = 
      memberInfo?.plan && 
      memberInfo.plan !== 'free' && 
      memberInfo.plan !== 'cd-key' &&
      memberInfo.subscription_id;

    if (hasActiveSubscription) {
      try {
        // Redirect to Stripe customer portal
        const { url } = await createPortal();
        window.open(url, '_blank');
      } catch (error) {
        console.error('Failed to create portal session:', error);
        // Fallback to choose plan dialog if portal fails
        setOpenChoosePlan(true);
      }
    } else {
      // Show choose plan dialog for non-subscribers
      setOpenChoosePlan(true);
    }
  };

  return (
    <Button appearance="gradientFill" shape="round" onClick={handleClick}>
      {t('auth.managePlan')}
      <ArrowRightIcon />
    </Button>
  )
}
