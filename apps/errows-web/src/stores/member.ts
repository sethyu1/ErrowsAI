import { create } from 'zustand';

type Stats = API.Member.Stats;
type Info = API.Member.InfoResult;

interface MemberStore {
  /** 会员统计信息 */
  stats: Stats;
  /** 当前会员信息 */
  info: Info;

  setStats: (stats: Stats) => void;
  setInfo: (info: Info) => void;
}

export const useMemberStore = create<MemberStore>()(
  set => ({
    stats: {} as Stats,
    info: {} as Info,

    setStats: (stats: Stats) => {
      set({
        stats,
      })
    },
    setInfo: (info: Info) => {
      set({
        info,
      })
    },
  }),
);
