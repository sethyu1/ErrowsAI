import {
  CharacterIcon,
  ChatIcon,
  DiscoverIcon,
  PostIcon,
  MultimediaIcon,
  MagicIcon,
  UnionIcon,
  DiamondFillIcon,
  DownloadIcon,
  VerifiedBadgeIcon,
  CrownOutlinedIcon,
  TelephoneIcon,
  DiscoverActiveIcon,
  ChatActiveIcon,
  PostActiveIcon,
  MultimeActiveIcon,
  CharacterActiveIcon,
  
} from "@errows/icons";

export const items = [
  {
    icon: DiscoverIcon,
    titleKey: "sidebar.discover",
    path: "/",
  },
  {
    icon: PostIcon,
    titleKey: "sidebar.post",
    path: "/post",
  },
  {
    icon: CharacterIcon,
    titleKey: "sidebar.character",
    path: "/character",
  },
  {
    icon: ChatIcon,
    titleKey: "sidebar.chat",
    path: "/chat",
  },
  {
    icon: MultimediaIcon,
    titleKey: "sidebar.myCreation",
    path: "/multimedia",
  },
  {
    icon: UnionIcon,
    titleKey: "sidebar.coins",
    path: "/coins",
  },
  {
    icon: DiamondFillIcon,
    titleKey: "sidebar.membership",
    path: "/choose-plan",
  },
];

export const bottomItems = [
  {
    icon: DiscoverIcon,
    activeIcon: DiscoverActiveIcon,
    titleKey: "sidebar.discover",
    path: "/",
  },
  {
    icon: PostIcon,
    activeIcon: PostActiveIcon,
    titleKey: "sidebar.post",
    path: "/post",
  },
  {
    icon: CharacterIcon,
    activeIcon: CharacterActiveIcon,
    titleKey: "sidebar.character",
    path: "/character",
  },
  {
    icon: ChatIcon,
    activeIcon: ChatActiveIcon,
    titleKey: "sidebar.chat",
    path: "/chat",
  },
  {
    icon: MultimediaIcon,
    activeIcon: MultimeActiveIcon,
    titleKey: "sidebar.myCreation",
    path: "/multimedia",
  },
];

export const actions = [
  {
    key: "support",
    icon: TelephoneIcon,
    titleKey: "sidebar.support",
  },
  {
    key: "about-us",
    icon: VerifiedBadgeIcon,
    titleKey: "sidebar.aboutUs",
  },
  // {
  //   key: "install-app",
  //   icon: DownloadIcon,
  //   titleKey: "sidebar.installApp",
  // },
  {
    key: "become-affiliate",
    icon: CrownOutlinedIcon,
    titleKey: "sidebar.becomeAffiliate",
  },
];
