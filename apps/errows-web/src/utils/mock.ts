// 生成随机头像URL - 使用 DiceBear API（多种风格可选）
export const avatarUrl = () => {
  const styles = [
    "avataaars",
    "bottts",
    "fun-emoji",
    "lorelei",
    "notionists",
    "personas",
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
};
