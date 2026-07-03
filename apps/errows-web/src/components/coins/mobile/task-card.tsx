import { useTranslation } from 'react-i18next';
import { useClaimTask } from '@/services/task';
import { Button } from '@errows/design/components/button';

interface TaskCardProps {
  data: API.Task.TaskInfo;
  progress: string;
}

export function TaskCard(props: TaskCardProps) {
  const { data, progress } = props;
  const { t } = useTranslation();
  const { claimTask, loading } = useClaimTask();

  const handleClaim = () => {
    claimTask(data.id);
  }

  // 判断是否可以领取
  const canClaim = data.is_completed && !data.is_claimed;
  
  // 获取按钮文本
  const getButtonText = () => {
    if (data.is_claimed) {
      return t('auth.claimed');
    }
    if (canClaim) {
      return t('auth.claim');
    }
    return progress;
  };

  return (
    <div className="flex px-3 py-3 box-border w-full h-26 bg-[#2C2C38]/70 border border-white/10 backdrop-blur-[2px] rounded-2xl">
      <div className="flex flex-col flex-1 min-w-0 mr-2">
        <span className="text-base text-[#F5F5F5] line-clamp-2 leading-tight h-10">
          {data?.title}
        </span>
        <span className="mt-2 text-[#A4ACB9] text-xs line-clamp-2 leading-tight">
          {data?.description}
        </span>
      </div>

      <div className="flex flex-col gap-6 ml-auto items-end flex-shrink-0">
        <div className="flex justify-end items-center gap-2">
          <span className="text-white">+{data?.token} {t('task.freeMessages')}</span>
        </div>
        <Button
          className="w-18 h-7 text-xs"
          appearance="gradientOutline"
          shape="round"
          loading={loading}
          disabled={!canClaim}
          onClick={handleClaim}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  )
}
