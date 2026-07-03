export interface ChatHeaderProps {
  /** 头像图片 URL */
  avatar: string;
  /** 角色名称 */
  name: string;
  /** 年龄 */
  age?: number;
  /** 描述文本 */
  description?: string;
}

export const ChatHeader = ({
  avatar,
  name,
  age,
  description,
}: ChatHeaderProps) => {
  return (
    <div className="w-[228px] flex">
      <div className="flex flex-col items-center gap-2">
        {/* 头像 */}
        <div className="w-30 h-30 max-sm:w-20 max-sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </div>

        {/* 名字和年龄 */}
        <div className="flex items-center justify-center gap-1">
          <h3 
            className="text-[24px] font-bold text-[#FCFCFC] text-center"
            style={{ fontFamily: 'Urbanist' }}
          >
            {name}
          </h3>
          {age && (
            <span 
              className="text-[24px] font-bold text-[#FCFCFC] text-center hidden"
              style={{ fontFamily: 'Urbanist' }}
            >
              ,{age}
            </span>
          )}
        </div>

        {/* 描述文本 */}
        {description && (
          <p className="text-xs text-gray-400 text-center max-w-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
