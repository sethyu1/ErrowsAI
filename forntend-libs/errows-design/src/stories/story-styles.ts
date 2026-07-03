// 统一的 Storybook 样式
export const storyStyles = {
  // 代码块样式 - 优化的 dark 模式
  codeBlock: {
    background: 'linear-gradient(135deg, #1a1d29 0%, #1f2937 100%)',
    padding: '20px',
    borderRadius: '12px',
    overflow: 'auto' as const,
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#e5e7eb',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    backdropFilter: 'blur(10px)',
  },
  
  // 标题样式
  h1: {
    marginBottom: '32px',
    fontSize: '36px',
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #DD429D 0%, #B14BF4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  h2: {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: '-0.01em',
  },
  
  h3: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: '-0.01em',
  },
  
  // 文本样式
  text: {
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: '1.6',
  },
  
  textMuted: {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: '1.5',
  },
  
  description: {
    fontSize: '14px',
    color: '#a1a8b3',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  
  // 容器样式
  container: {
    padding: '48px',
    maxWidth: '1200px',
    background: 'rgba(10, 11, 15, 0.5)',
    borderRadius: '16px',
  },
  
  section: {
    marginBottom: '48px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  
  // 卡片样式
  card: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  
  // 分隔线
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    margin: '24px 0',
  },
};
