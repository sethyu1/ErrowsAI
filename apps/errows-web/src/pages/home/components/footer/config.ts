export const platform = [
  {
    nameKey: "footer.aiGirlfriends",
    key: "ai-girlfriends",
  },
  {
    nameKey: "footer.nsfwAiChat",
    key: "nsfw-aichat",
  },
  {
    nameKey: "footer.aiHentaiImage",
    key: "ai-hentai-image",
  },
  {
    nameKey: "footer.post",
    key: "post",
  },
  {
    nameKey: "footer.multimedia",
    key: "multimedia",
  },
];

export const resource = [
  {
    nameKey: "footer.support",
    key: "support",
  },
  {
    nameKey: "footer.faq",
    key: "faq",
  },
  {
    nameKey: "footer.legal",
    key: "legal",
  },
  {
    nameKey: "footer.becomeAffiliate",
    key: "become-an-affiliate",
  },
  {
    nameKey: "footer.communityGuidelines",
    key: "community-guidelines",
  },
];

export const handleResourceClick = (
  key: string,
  navigate?: (path: string) => void,
  openSupportDialog?: () => void
) => {
  // navigate(key);
  switch (key) {
    case "support":
      // 打开模态框/抽屉
      openSupportDialog?.();
      break;
    case "faq":
      navigate?.("/faq");
      break;
    case "legal":
      navigate?.("/faq#legal-information");
      break;
    case "become-an-affiliate":
      navigate?.("/become-an-affiliate");
      break;
    case "community-guidelines":
      navigate?.("/description/community-guidelines");
      break;
    default:
      break;
  }
};

export const handlePlatformClick = (
  key: string,
  navigate?: (path: string) => void
) => {
  // navigate(key);
  switch (key) {
    case "ai-girlfriends":
      //设置tags为Female， 这里需要确定是追加还是覆盖，目前直接覆盖
      window.localStorage.setItem(
        "__tags__",
        JSON.stringify([["gender", ["Female"]]])
      );
      if (window.location.pathname === "/") {
        window.location.reload();
      } else {
        navigate?.("/");
      }
      break;
    case "nsfw-aichat":
      navigate?.("/");
      break;
    case "ai-hentai-image":
      navigate?.("/character");
      break;
    case "post":
      navigate?.("/post");
      break;
    case "multimedia":
      navigate?.("/multimedia");
      break;
    default:
      break;
  }
};
