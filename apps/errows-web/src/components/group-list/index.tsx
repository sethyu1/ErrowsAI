import React from "react";

interface GroupListProps {
    className?: string;
    style?: React.CSSProperties;
    title: string;
    subTitle: string;
}

export const GroupList: React.FC<React.PropsWithChildren<GroupListProps>> = (props) => {
    const { className, style, title, subTitle, children } = props;
    return (
        <div className={`${className} flex relative flex-col items-center justify-end gap-3 pt-2 pb-15 bg-[#0E0F17]`} style={style}>
            <div className="flex items-center flex-col w-full">
                <span className="text-[#f5f5f5] text-center" style={{
                    fontFamily: 'Urbanist',
                    fontWeight: 700,
                    fontSize: '56px',
                    lineHeight: '66px',
                    letterSpacing: '-1%',
                }}>{title}</span>
                <span className="text-[#DBDBE6] text-center mt-4" style={{
                    fontFamily: 'Urbanist',
                    fontWeight: 400,
                    fontSize: '22px',
                    lineHeight: '34px',
                    letterSpacing: '0%',
                }}>{subTitle}</span>
            </div>
            <div className="absolute top-[99px] right-[56px] h-[52px] flex items-center rounded-full cursor-pointer hover:opacity-90 transition-opacity p-[2px]" style={{
                background: 'linear-gradient(90deg, #C74FC7 0%, #7B4FE0 100%)',
            }}>
                <div className="flex items-center gap-2 px-6 h-full rounded-full bg-[#0E0F17]">
                    <span className="text-white font-bold text-[14px]">Discover more</span>
                    <span className="text-white text-[16px]">→</span>
                </div>
            </div>
            <div className="flex-1 flex flex-nowrap gap-6 mt-16">
                {children}
            </div>

        </div>
    )
}
