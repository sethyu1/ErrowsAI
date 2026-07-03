import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { GlobalSever, Loading, Support } from "@/components";
import { Layout } from "./components/layout";
import { Toaster, ThemeProvider, TooltipProvider } from "@errows/design";
import './App.css';
import { usePixel } from "@/services/auth/pixel";
import { usePixelStore } from "@/stores/pixel";
import { useMemberStore } from "@/stores/member";
import { useGlobalServer } from "@/hooks/use-global-server";
import { useEffect } from "react";
import { addPrefix } from "@/utils";
import { NSFWProvider } from "@/contexts/nsfw-context";

// 懒加载路由组件
const Home = lazy(() => import("./pages/home"));
const Verify = lazy(() => import("./pages/verify"));
const CreateRole = lazy(() => import("./pages/role/create-page"));
const RoleGallery = lazy(() => import("./pages/role/gallery"));
const Post = lazy(() => import("./pages/post"));
const PostDetail = lazy(() => import("./pages/post/detail"));
const Chat = lazy(() => import("./pages/chat"));
const Multimedia = lazy(() => import("./pages/multimedia/List"));
const MultimediaDetail = lazy(() => import("./pages/multimedia/Detail"));
const ForgotPassword = lazy(() => import("./pages/forgot-password"));
const InfiniteScrollExample = lazy(
  () => import("./pages/examples/InfiniteScrollExample")
);
const Account = lazy(() => import("./pages/accont"));
// 生成图片
const GenerateImage = lazy(() => import("./pages/generate/image"));
// 生成视频
const GenerateVideo = lazy(() => import("./pages/generate/video"));
const AboutUs = lazy(() => import("./pages/about-us"));
const UpComing = lazy(() => import("./pages/upcoming"));
const Description = lazy(() => import("./pages/description"));
const FAQ = lazy(() => import("./pages/faq"));
const Coins = lazy(() => import("./pages/coins"));
const ChoosePlan = lazy(() => import("./pages/choose-plan"));
const Blog = lazy(() => import("./pages/blog"));
const BlogDetail = lazy(() => import("./pages/blog/detail"));

function App() {
  const saveFromQuery = usePixelStore(state => state.saveFromQuery);
  const { info: memberInfo } = useMemberStore();
  const { setOpenChoosePlan } = useGlobalServer();

  useEffect(
    () => {
      saveFromQuery();
    },
    [saveFromQuery]
  );

  // 免费用户每天首次访问弹付费窗口
  useEffect(() => {
    return;
    if (memberInfo?.plan === 'free') {
      const STORAGE_KEY = addPrefix('daily_popup_date');
      const lastPopupDate = localStorage.getItem(STORAGE_KEY);
      const today = new Date().toDateString();

      if (lastPopupDate !== today) {
        setOpenChoosePlan(true);
        localStorage.setItem(STORAGE_KEY, today);
      }
    }
  }, [memberInfo?.plan, setOpenChoosePlan]);

  usePixel();
  return (
    <NSFWProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <BrowserRouter>
          <Suspense
            fallback={
              <div className="w-full h-lvh flex items-center justify-center text-6xl">
                <Loading />
              </div>
            }
          >
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/account" element={<Account />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/coins" element={<Coins />} />
                <Route path="/choose-plan" element={<ChoosePlan />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogDetail />} />
                {/* <Route path="/role/create" element={<CreateRole />} /> */}
                <Route path="/post" element={<Post />} />
                <Route path="/post/:id" element={<PostDetail />} />
                {/* <Route path="/character" element={<Character />} /> */}
                <Route path="/character" element={<RoleGallery />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/multimedia" element={<Multimedia />} />
                <Route path="/multimedia/info/:roleId" element={<MultimediaDetail />} />
                <Route path="/examples" element={<InfiniteScrollExample />} />
                <Route path="/role/create" element={<CreateRole />} />

                <Route path="/generate/image/:roleId" element={<GenerateImage />} />
                <Route path="/generate/video/:roleId" element={<GenerateVideo />} />

                <Route path="/generate/image" element={<GenerateImage />} />
                <Route path="/generate/video" element={<GenerateVideo />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/upcoming" element={<UpComing />} />
                <Route path="/description/:id" element={<Description />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/:tagName" element={<Home />} />
              </Route>
              {/* 无匹配路由，跳转到首页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <GlobalSever />
          <Support />
          <Toaster
            position="top-center"
            closeButton={false}
            duration={2000}
          />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </NSFWProvider>
  );
}

export default App;
