import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogOverlay,
  DialogDescription,
} from '@errows/design/components/dialog';
import { InfoCard } from './components';
import { LoginForm } from './login-form';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LoginDialogProps extends React.ComponentProps<typeof Dialog> {}

export function AuthDialog(props: LoginDialogProps) {
  return (
    <Dialog {...props}>
      <DialogOverlay />

      <DialogContent
        className="w-207.5 rounded-2xl p-0 overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          maxWidth: 'none',
          border: '1px solid rgba(255,255,255,10%)'
        }}
        // 阻止点击遮罩层关闭对话框
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="hidden">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="flex flex-row w-full h-[600px] overflow-hidden">
          <div className="flex-1 h-full">
            <LoginForm />
          </div>
          <div className="flex-1 h-full">
            <InfoCard />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
