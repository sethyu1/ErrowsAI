import bg from '@/assets/images/background/plan.webp';
import { ChoosePlanPage } from '@/components/choose-plan';

export function ChoosePlan() {
  return (
    <div
      className="flex mt-20 pt-4 pb-10 w-full overflow-auto justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: '352px',
        backgroundPosition: 'top 80px right 0px',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <ChoosePlanPage />
    </div>
  )
}

export default ChoosePlan;
