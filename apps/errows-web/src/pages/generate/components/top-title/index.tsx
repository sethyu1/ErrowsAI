import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { AdvancedSwitch } from '@/components';
import { useMobile } from '@/hooks/use-mobile-detector';
import { BarTitle } from '@/components/bar-title';
import { RoleSelector } from '@/components';
import type { RoleSelectorRef } from '@/components';
import { alertDialog } from '@errows/design';
import { useGlobalServer } from '@/hooks/use-global-server';

interface TopTitleProps {
    isMember?: boolean;
    roleId?: string;
    title?: string;
    videoContent?: string;
    showMode?: boolean;
    onUserSelect?: (roleId: string) => void;
    onModeChange?: (mode: string) => void;
    onClose?: () => void;
}

export interface TopTitleRef {
    roleSelectorOpen: () => void;
}

export const TopTitle = forwardRef<TopTitleRef, TopTitleProps>((props, ref) => {
    const { t } = useTranslation();
    const { setOpenChoosePlan } = useGlobalServer();
    const { roleId, title, videoContent, showMode = false, isMember, onUserSelect, onModeChange, onClose } = props;
    const navigate = useNavigate();
    const roleSelectorRef = useRef<RoleSelectorRef>(null);
    const isMobile = useMobile();
    const [mode, setMode] = useState<string>(t('common.basic'));

    useImperativeHandle(ref, () => ({
        roleSelectorOpen: () => {
            roleSelectorRef.current?.open();
        },
    }), []);

    const handleSwitchMode = (v: string) => {
        if(!isMember) {
            alertDialog.confirm({
                title: t('generate.upgradeTitle'),
                content: t('generate.upgradeDesc'),
                confirmText: t('generate.upgradeBtn'),
                cancelText: t('common.cancel'),
                onConfirm: () => {
                   if(isMobile) {
                    setOpenChoosePlan(true);
                   } else {
                    navigate('/choose-plan');
                   }
                },
              });
              return;
        } else {
            setMode(v);
            onModeChange?.(v);
        }
    }

    return (
        <div>
            <div
                className={cn('w-full flex flex-col', isMobile ? 'pt-0' : 'pt-24')}
            >
                <div className={cn('relative flex items-center', isMobile ? 'pt-0' : 'pt-4 pr-4')}>
                    <BarTitle
                        title={title}
                        mode={mode}
                        subTitle={videoContent}
                        onClose={onClose}
                    />
                    {!isMobile && showMode && <AdvancedSwitch value={mode} onChange={handleSwitchMode} />}
                </div>
            </div>
           <div className={`flex justify-between items-center ${isMobile ? 'pt-4' : ''}`}>
                <RoleSelector defaultRoleId={roleId}  ref={roleSelectorRef} onConfirm={onUserSelect}/>
                {isMobile && showMode && <AdvancedSwitch value={mode} onChange={handleSwitchMode} />
                }
            </div>

        </div>
    );
});
