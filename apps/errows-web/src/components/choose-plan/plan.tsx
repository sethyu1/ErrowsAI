import { Dialog } from '@errows/design/components/dialog';
import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';
import { ChoosePlanDialog } from './dialog';
import { ChoosePlanDrawer } from './mobile';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChoosePlanProps extends React.ComponentProps<typeof Dialog> {}

export function ChoosePlan(props: ChoosePlanProps) {
  const {
    isMobile,
  } = useGlobalStore(useShallow(state => ({
    isMobile: state.isMobile,
  })));

  return (
    <>
      {/* 会员订阅计划 */}
      {isMobile ? <ChoosePlanDrawer {...props} /> : <ChoosePlanDialog {...props} />}
    </>
  )
}
