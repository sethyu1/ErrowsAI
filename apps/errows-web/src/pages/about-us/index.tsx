import React from "react";
import { useTranslation } from "react-i18next";
import Film from "./components/film";
import { GradientText } from "@/components/gradient-text";
import { StarIcon } from "@errows/icons";
import { Button } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";
import { useGlobalServer } from "@/hooks/use-global-server";
import { ChatItem } from "./components/chat-item";
import ResearchItem from "./components/research-item";
import { fetchCharacterDiscoverListApi, fetchNotionBlogApi } from "@/apis";
import Gallery from "./components/gallery";
import { Footer } from "./components/footer";

//一些资源导入
import avatar1 from "./assets/Avatar1.png";
import avatar2 from "./assets/Avatar2.png";
import avatar3 from "./assets/Avatar3.png";
import avatar4 from "./assets/Avatar4.png";
import ChatImage from "./assets/Image.jpg";
import ResearchImage1 from "./assets/Research1.jpg";
import ResearchImage2 from "./assets/Research2.jpg";
import ResearchImage3 from "./assets/Research3.jpg";
import ResearchImage4 from "./assets/Research4.jpg";
import BlogCover1 from "./assets/blog/1c2269854a2b53c795ffa2760aa43628.webp";
import BlogCover2 from "./assets/blog/604c2d3d59c7d34d052cbda5743b95dc.webp";
import BlogCover3 from "./assets/blog/79a9576f12d5ce0331fc85da27345965.webp";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router";
import { useAuthCheck } from "@/hooks/use-auth-check";

const AboutUs: React.FC = () => {
  const { t } = useTranslation();
  const { isLogin, gotoLogin } = useAuthCheck();
  const isMobile = useIsMobile();
  const [characters, setCharacters] = React.useState<API.Character.CHARACTER[]>(
    []
  );
  const [blogList, setBlogList] = React.useState<Array<{
    id: string;
    title: string;
    summary: string;
    date: string;
    cover: string;
  }>>([]);
  const navigate = useNavigate();
  const { setOpenAuth } = useGlobalServer();

  const handleStartFreeTrial = () => {
    setOpenAuth(true, "login");
  };

  React.useEffect(() => {
    fetchCharacterDiscoverListApi({
      page: 0,
      size: 80, // 增加获取的图片数量
    }).then((res) => {
      setCharacters(
        (res.data as API.Character.CHARACTER[])?.filter(
          (character) => character.avatar_url
        )
      );
    });
  }, []);

  React.useEffect(() => {
    fetchNotionBlogApi({ limit: 3 })
      .then((articles) => {
        const formattedArticles = articles.map((article) => {
          // 格式化日期
          let formattedDate = article.date || '';
          if (formattedDate) {
            try {
              const date = new Date(formattedDate);
              formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            } catch (e) {
            }
          }

          const cover = article.thumbnail || BlogCover1;

          return {
            id: article.id,
            title: article.title,
            summary: article.content || '',
            date: formattedDate,
            cover,
          };
        });

        if (formattedArticles.length < 3) {
          const defaultArticles = [
            {
              id: "post-1",
              title: t("aboutUs.blog.posts.0.title"),
              summary: t("aboutUs.blog.posts.0.summary"),
              date: "Oct 24, 2025",
              cover: BlogCover1,
            },
            {
              id: "post-2",
              title: t("aboutUs.blog.posts.1.title"),
              summary: t("aboutUs.blog.posts.1.summary"),
              date: "Nov 02, 2025",
              cover: BlogCover2,
            },
            {
              id: "post-3",
              title: t("aboutUs.blog.posts.2.title"),
              summary: t("aboutUs.blog.posts.2.summary"),
              date: "Dec 12, 2025",
              cover: BlogCover3,
            },
          ];

          const merged = [
            ...formattedArticles,
            ...defaultArticles.slice(formattedArticles.length, 3),
          ];
          setBlogList(merged);
        } else {
          setBlogList(formattedArticles);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch Notion blog articles:', error);
        setBlogList([
          {
            id: "post-1",
            title: t("aboutUs.blog.posts.0.title"),
            summary: t("aboutUs.blog.posts.0.summary"),
            date: "Oct 24, 2025",
            cover: BlogCover1,
          },
          {
            id: "post-2",
            title: t("aboutUs.blog.posts.1.title"),
            summary: t("aboutUs.blog.posts.1.summary"),
            date: "Nov 02, 2025",
            cover: BlogCover2,
          },
          {
            id: "post-3",
            title: t("aboutUs.blog.posts.2.title"),
            summary: t("aboutUs.blog.posts.2.summary"),
            date: "Dec 12, 2025",
            cover: BlogCover3,
          },
        ]);
      });
  }, [t]);


  return (
    <div className="w-full h-full flex flex-col overflow-y-auto" id="home-scroll-container">
      <Film className="shrink-0" characters={characters}>
        <div className="flex flex-col items-center justify-center z-20">
          <div className="font-urbanist font-bold text-[56px] leading-[60px] text-center text-[#F5F5F5]">
            {t("aboutUs.hero.title1")}
          </div>
          <div className="font-urbanist font-bold text-[56px] leading-[60px] text-center text-[#F5F5F5]">
            {t("aboutUs.hero.title2")}
          </div>
          <div className=" w-[666px] max-sm:w-[326px] font-urbanist font-medium text-[22px] leading-[34px] text-center text-[#DBDBE6]">
            {t("aboutUs.hero.description")}
          </div>
          {isMobile && !isLogin && (
            <Button
              appearance="gradientFill"
              className="cursor-pointer mt-12"
              shape="round"
              onClick={handleStartFreeTrial}
            >
              <span className="text-white font-bold text-[14px]">
                {t("aboutUs.hero.startFreeTrial")}
              </span>
              <ArrowRightIcon className="size-4 text-white" />
            </Button>
          )}
        </div>
      </Film>

      <div className="flex flex-wrap bg-[#0E0F17] px-[96px] max-sm:px-3 justify-between py-16">
        <div className="w-[560px] max-sm:w-full max-sm:mb-10 font-urbanist font-bold text-[24px] leading-[34px] text-[#F5F5F5]">
          {t("aboutUs.stats.creatorsChosen")}
        </div>
        <div className="flex flex-col w-[294px] max-sm:w-[167px] gap-2">
          <GradientText className="font-urbanist font-bold text-[28px] leading-[40px]">
            100M+
          </GradientText>
          <div className="font-urbanist font-regular text-[14px] text-[#F5F5F5]">
            {t("aboutUs.stats.imagesGenerated")}
          </div>
        </div>
        <div className="flex flex-col w-[294px] max-sm:w-[167px]">
          <div className="flex relative w-full h-9">
            <img
              src={avatar1}
              alt="avatar"
              className="size-9 rounded-full absolute top-0 left-0"
            />
            <img
              src={avatar2}
              alt="avatar"
              className="size-9 rounded-full absolute top-0 left-7"
            />
            <img
              src={avatar3}
              alt="avatar"
              className="size-9 rounded-full absolute top-0 left-14"
            />
            <img
              src={avatar4}
              alt="avatar"
              className="size-9 rounded-full absolute top-0 left-21"
            />
          </div>
          <div className="flex mt-[20px]">
            <StarIcon className="size-[18px] text-[#FFA021]" />
            <span>4.8</span>
            <span>{t("aboutUs.stats.rating")}</span>
          </div>
          <div className="font-urbanist font-regular text-[14px] text-[#F5F5F5] leading-[22px] mt-[2px]">
            {t("aboutUs.stats.lovedByCreators")}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex flex-col items-center bg-[#090A0A] max-sm:px-3">
        <div className="font-urbanist font-bold text-[56px] leading-[66px] text-center text-[#F5F5F5]">
          {t("aboutUs.products.title")}
        </div>
        <div className="w-[635px] mt-4 max-sm:mt-3  max-sm:w-full font-urbanist font-regular text-[22px] leading-[34px]  text-center text-[#F5F5F5]">
          {t("aboutUs.products.description")}
        </div>
        <div className="flex mt-16 max-sm:mt-6 justify-center items-center gap-2 p-3 rounded-full border border-[#22232A]">
          <Button appearance="gradientFill" shape="round" size={"lg"} onClick={() => {
            if (!isLogin) {
              gotoLogin();
              return;
            }
            navigate('/chat');
          }}>
            {t("aboutUs.products.chat")}
          </Button>
          <Button
            size={"lg"}
            className="bg-[#22232A] rounded-full text-[#F5F5F5] hover:bg-[#2A2B32] transition-colors"
            onClick={() => {
              if (!isLogin) {
                gotoLogin();
                return;
              }
              navigate('/multimedia');
            }}
          >
            {t("aboutUs.products.generate")}
          </Button>
          <Button
            size={"lg"}
            className="bg-[#22232A] rounded-full text-[#F5F5F5] hover:bg-[#2A2B32] transition-colors"
            onClick={() => navigate('/upcoming')}
          >
            {t("aboutUs.products.ugc")}
          </Button>
        </div>
        <div className="flex max-sm:flex-col-reverse mt-10 max-sm:mt-6 gap-6">
          <div className="flex flex-col gap-12  w-[476px] max-sm:w-full ">
            <div className="max-sm:hidden font-urbanist font-bold text-[48px] leading-[64px] text-[#F5F5F5]">
              {t("aboutUs.products.chat")}
            </div>

            <ChatItem text={t("aboutUs.products.chatFeatures.feature1")} />

            <ChatItem text={t("aboutUs.products.chatFeatures.feature2")} />

            <ChatItem text={t("aboutUs.products.chatFeatures.feature3")} />

            <Button
              size={"lg"}
              className="w-[156px] bg-[#22232A] rounded-full text-[#F5F5F5] hover:bg-[#2A2B32] transition-colors"
              onClick={() => navigate('/')}
            >
              {t("aboutUs.products.tryNow")} <ArrowRightIcon className="size-4" />
            </Button>
          </div>
          <img src={ChatImage} alt="chat" className="w-[476px] h-[440px]" />
        </div>
      </div>

      {/* Research */}
      <div className="flex flex-col bg-[#090A0A] px-[96px] pt-[144px] max-sm:pt-14 max-sm:px-3">
        <div className="font-urbanist font-bold text-[56px] leading-[66px] text-[#F5F5F5] mb-[70px] max-sm:mb-10">
          {t("aboutUs.research.title")}
        </div>
        <div className="flex flex-wrap  max-sm:flex-col  justify-between max-sm:gap-9">
          <ResearchItem
            className="w-[calc(50%-40px)] max-sm:w-full"
            title={t("aboutUs.research.models.title")}
            description={t("aboutUs.research.models.description")}
            image={ResearchImage1}
          />
          <ResearchItem
            className="w-[calc(50%-40px)] max-sm:w-full"
            title={t("aboutUs.research.aiPartners.title")}
            description={t("aboutUs.research.aiPartners.description")}
            image={ResearchImage2}
          />
          <ResearchItem
            className="w-[calc(50%-40px)] mt-10 max-sm:w-full max-sm:mt-0"
            title={t("aboutUs.research.aiImages.title")}
            description={t("aboutUs.research.aiImages.description")}
            image={ResearchImage3}
          />
          <ResearchItem
            className="w-[calc(50%-40px)] mt-10 max-sm:w-full max-sm:mt-0"
            title={t("aboutUs.research.aiVideo.title")}
            description={t("aboutUs.research.aiVideo.description")}
            image={ResearchImage4}
          />
        </div>
      </div>

      {/* Gallery */}
      <div className="flex flex-col bg-[#090A0A] px-[96px] pt-[144px] pb-14 max-sm:pb-6 max-sm:pt-14 max-sm:px-3">
        <div className="font-urbanist font-bold text-[56px] leading-[66px] text-[#F5F5F5] mb-[48px] max-sm:mb-10">
          {t("aboutUs.gallery.title")}
        </div>
        <Gallery characters={characters} />
        <div className="flex justify-center mt-10 max-sm:mt-[20px]">
          <Button appearance="gradientOutline" shape="round" onClick={() => navigate('/')}>
            {t("aboutUs.gallery.seeMore")} <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Blog */}
      <div className="flex flex-col bg-[#090A0A] px-[96px] pt-[72px] pb-16 max-sm:px-3 max-sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="font-urbanist font-bold text-[48px] leading-[58px] text-[#F5F5F5]">
            {t("aboutUs.blog.title")}
          </div>
          <button
            className="text-sm font-bold text-[#C9C1FF] hover:text-white transition-colors"
            onClick={() => navigate('/blog')}
          >
            {t("aboutUs.blog.viewMore")}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {blogList.map(post => (
            <div
              key={post.id}
              className="group flex items-stretch gap-6 p-5 rounded-2xl border border-white/10 bg-[#0E0F17] cursor-pointer transition-colors hover:border-white/25 max-sm:flex-col"
              onClick={() => navigate('/blog')}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#A4ACB9] mb-2">
                  {post.date}
                </div>
                <div
                  className="text-[28px] leading-8 font-bold text-[#F5F5F5] transition-colors group-hover:text-[#B14BF4]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.title}
                </div>
                <div
                  className="mt-3 text-base leading-6 text-[#C5C8D4]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.summary}
                </div>
              </div>

              <div className="w-[240px] h-[160px] rounded-xl overflow-hidden shrink-0 max-sm:w-full max-sm:h-[200px]">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};
export default AboutUs;
