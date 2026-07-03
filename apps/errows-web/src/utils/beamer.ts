declare global {
    interface Window {
        Beamer?: any;
        beamer_config?: any;
    }
}

/**
 * 初始化Beamer配置
 * @param userId 用户唯一ID
 * @param userEmail 用户邮箱
 * @param customUserId 自定义用户ID
 */
export const initBeamerConfig = (
    userId: string,
    userEmail: string,
    customUserId?: string
) => {
    // 配置Beamer全局变量
    window.beamer_config = {
        product_id: "MolqZvbG73949",  //Beamer产品ID
        language: "EN",
        userId,
        userEmail,
        customUserId: customUserId || "",
        display: "embed", // 使用嵌入模式

        // 内容显示配置
        showNews: false,
        changelogView: true, // 显示更新日志
        roadmapView: false, // 不显示路线图
        featureRequestsView: false, // 不显示功能建议

        // 用户界面配置
        focus: false,
        preview: false,
        accessibilityMode: false,
        multilineFeedback: true,
        enableAutofocusComments: true,

        // 其他配置
        followLinks: false,
        forceNativeScroll: false,
        addUtmParameters: true,
    };

    // Beamer脚本加载完成后自动初始化
    if (window.Beamer) {
        window.Beamer.init?.();
    }
};

/**
 * 初始化Beamer - 加载脚本
 */
export const initBeamer = () => {
    if (typeof window === 'undefined') return;

    if (window.Beamer) {
        return;
    }

    // 动态加载Beamer JS脚本
    const loadBeamerScript = () => {
        if (document.querySelector('script[src*="beamer-embed.js"]')) {
            waitForBeamerEmbed();
            return;
        }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://app.getbeamer.com/js/beamer-embed.js';
        script.async = true;

        script.onload = () => {
            console.log('Beamer脚本加载成功');
            waitForBeamerEmbed();
        };

        script.onerror = () => {
            console.error('Beamer脚本加载失败');
        };

        document.head.appendChild(script);
    };

    // 等待Beamer对象可用
    const waitForBeamerEmbed = () => {
        if (window.Beamer) {
            console.log('Beamer已初始化，可以使用');
            return;
        }

        let retries = 0;
        const maxRetries = 50; // 5秒超时

        const checkBeamer = setInterval(() => {
            if (window.Beamer) {
                console.log('Beamer对象已加载');
                clearInterval(checkBeamer);
            } else if (retries >= maxRetries) {
                console.warn('Beamer加载超时，请检查网络连接');
                clearInterval(checkBeamer);
            }
            retries++;
        }, 100);
    };

    loadBeamerScript();
};

/**
 * 打开Beamer通知面板
 */
export const openBeamerPanel = () => {
    if (window.Beamer) {
        // 打开BeamerEmbed面板
        window.Beamer.open?.();
        console.log('BeamerEmbed通知面板已打开');
    } else {
        console.warn('BeamerEmbed还未加载');
    }
};

/**
 * 关闭Beamer通知面板
 */
export const closeBeamerPanel = () => {
    if (window.Beamer) {
        window.Beamer.close?.();
    }
};