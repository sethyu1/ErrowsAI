import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useShallow } from 'zustand/react/shallow';
import { initBeamerConfig, initBeamer } from '@/utils/beamer';

/**
 * 应用启动时初始化Beamer
 */
export const BeamerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuthStore(
        useShallow((state) => ({
            token: state.token,
            user: state.user,
        }))
    );

    const isInitializing = useRef(false);

    useEffect(() => {
        if (!isInitializing.current) {
            isInitializing.current = true;
            initBeamer();
        }
    }, []);

    // 第二步：用户登录后自动配置用户信息
    useEffect(() => {
        if (token && user?.id && user?.email) {
            initBeamerConfig(
                user.id,
                user.email,
                user.id
            );
        }
    }, [token, user?.id, user?.email]);

    return <>{children}</>;
};

