import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Footer } from "../about-us/components/footer";
import { fetchNotionBlogApi, type NotionBlogArticle } from "@/apis/notion";

import heroImg1 from "../about-us/assets/blog/1c2269854a2b53c795ffa2760aa43628.webp";
import heroImg2 from "../about-us/assets/blog/604c2d3d59c7d34d052cbda5743b95dc.webp";
import heroImg3 from "../about-us/assets/blog/9ccec51507781c9e13c5ba0008805c75.webp";
import heroImg4 from "../about-us/assets/blog/af995ba3dbe67bcd83d64de9275ae859.webp";
import heroImg5 from "../about-us/assets/blog/ef9a97c5b99936edd1aed9f7ace6912c.webp";

const PAGE_SIZE = 3;

const Blog: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1); // 1-based 页码，方便和 UI 对齐
  const [articles, setArticles] = React.useState<NotionBlogArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalArticles, setTotalArticles] = React.useState(0);

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const allArticles = await fetchNotionBlogApi({ limit: 30 });
        setArticles(allArticles);
        setTotalArticles(allArticles.length);
      } catch (error) {
        console.error('Failed to fetch blog articles:', error);
        setArticles([]);
        setTotalArticles(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pagedArticles = React.useMemo(
    () =>
      articles.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [articles, currentPage]
  );

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadArticle = (id: string) => {
    navigate(`/blog/${id}`);
  };

  // 顶部展示用的文章（固定展示 5 个，不足时循环补齐）
  const heroArticles = React.useMemo(() => {
    const HERO_COUNT = 5;
    if (articles.length >= HERO_COUNT) {
      return articles.slice(0, HERO_COUNT);
    }
    const list: NotionBlogArticle[] = [];
    while (list.length < HERO_COUNT && articles.length > 0) {
      list.push(...articles);
    }
    return list.slice(0, HERO_COUNT);
  }, [articles]);

  
  const heroImageSources = React.useMemo(() => {
    return [
      heroImg1,
      heroImg2,
      heroImg3,
      heroImg4,
      heroImg5,
    ];
  }, []);

  const tiltDegrees = [-4, -2, 2, 3, -3];

  return (
    <div className="w-full min-h-screen bg-[#090A0A] text-[#F5F5F5] flex flex-col overflow-y-auto">
      {/* 顶部 Hero 区域 */}
      <div className="px-[96px] pt-[120px] pb-16 max-sm:px-4 max-sm:pt-[96px]">
        <div className="max-w-6xl mx-auto rounded-[40px] bg-[#111015] px-16 pt-16 pb-12 max-sm:px-5 max-sm:pt-8 max-sm:pb-8">
          {/* 标题与描述整体居中 */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-sm font-semibold tracking-[0.25em] uppercase text-[#9CA3AF] mb-3">
              {t("blog.pageTitle")}
            </div>
            <div className="text-[40px] leading-[48px] font-bold mb-4">
              {t("blog.pageMainTitle")}
            </div>
            <div className="text-base text-[#C5C8D4] leading-7">
              {t("blog.pageDesc")}
            </div>
          </div>

          {/* 顶部横向 5 张图片，桌面端铺满宽度，移动端可横向滚动 */}
          <div className="mt-10 w-full hidden md:flex items-center justify-between gap-6">
            {heroImageSources.map((src, index) => {
              const tilt = tiltDegrees[index % tiltDegrees.length];
              const article = heroArticles[index];
              return (
                <button
                  key={`hero-img-${index}`}
                  type="button"
                  className="relative rounded-[32px] overflow-hidden border border-white/10 hover:border-white/40 bg-[#14151F] transition-transform duration-300"
                  onClick={() => article && handleReadArticle(article.id)}
                  style={{
                    // 参考图一，约 300x330，稍高于宽
                    width: "300px",
                    height: "330px",
                    transform: `rotate(${tilt}deg)`,
                  }}
                >
                  <img
                    src={src}
                    alt={article?.title || `Blog image ${index + 1}`}
                    className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  />
                </button>
              );
            })}
          </div>

          {/* 移动端：保持图片比例，支持左右滑动 */}
          <div className="mt-8 flex md:hidden gap-4 overflow-x-auto pb-1">
            {heroImageSources.map((src, index) => {
              const tilt = tiltDegrees[index % tiltDegrees.length];
              const article = heroArticles[index];
              return (
                <button
                  key={`hero-img-mobile-${index}`}
                  type="button"
                  className="relative shrink-0 rounded-[32px] overflow-hidden border border-white/10 hover:border-white/40 bg-[#14151F] transition-transform duration-300"
                  onClick={() => article && handleReadArticle(article.id)}
                  style={{
                    // 移动端按等比例缩小
                    width: "180px",
                    height: "200px",
                    transform: `rotate(${tilt}deg)`,
                  }}
                >
                  <img
                    src={src}
                    alt={article?.title || `Blog image ${index + 1}`}
                    className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 文章列表 + 分页 */}
      <div className="flex-1 bg-[#090A0A] px-[96px] pb-16 max-sm:px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center py-12 text-[#9CA3AF]">
              {t("common.loading") || "Loading..."}
            </div>
          ) : pagedArticles.length === 0 ? (
            <div className="text-center py-12 text-[#9CA3AF]">
              {t("blog.noArticles") || "No articles found"}
            </div>
          ) : (
            pagedArticles.map((article) => {
              // 格式化日期
              let formattedDate = article.date || '';
              if (formattedDate) {
                try {
                  const date = new Date(formattedDate);
                  formattedDate = date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });
                } catch (e) {
                  // 如果日期解析失败，使用原始值
                }
              }

              // 使用默认图片作为缩略图（如果没有 thumbnail）
              const defaultThumbnail = heroImg1;
              const thumbnailUrl = article.thumbnail || defaultThumbnail;

              return (
                <div
                  key={article.id}
                  className="group flex items-stretch gap-6 p-5 rounded-2xl border border-white/10 bg-[#0E0F17] cursor-pointer transition-colors hover:border-white/25 max-sm:flex-col"
                  onClick={() => handleReadArticle(article.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#A4ACB9] mb-2">
                      {formattedDate}
                    </div>
                    <div
                      className="text-[28px] leading-8 font-bold text-[#F5F5F5] transition-colors group-hover:text-[#B14BF4] mb-3"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {article.title}
                    </div>
                    <div
                      className="text-base leading-6 text-[#C5C8D4] mb-4"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {article.content.replace(/\[IMAGE:\d+\]\s*/g, '')}
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-[#C9C1FF] group-hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReadArticle(article.id);
                      }}
                    >
                      {t("blog.readArticle") || "Read Article"}
                    </button>
                  </div>

                  <div className="w-[240px] h-[160px] rounded-xl overflow-hidden shrink-0 max-sm:w-full max-sm:h-[200px]">
                    <img
                      src={thumbnailUrl}
                      alt={article.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              );
            })
          )}
          </div>

          {/* 分页器 */}
          <div className="max-w-4xl mx-auto mt-10 flex items-center justify-between text-sm text-[#9CA3AF]">
          <button
            type="button"
            className={`px-3 py-1 rounded-full border border-transparent hover:border-[#4B5563] hover:text-white transition-colors ${
              currentPage === 1 ? "opacity-40 cursor-default" : ""
            }`}
            disabled={currentPage === 1}
            onClick={() => handleChangePage(currentPage - 1)}
          >
            {t("blog.pagination.previous")}
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const isActive = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`min-w-[32px] h-8 px-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white text-black"
                      : "text-[#D1D5DB] hover:bg-[#1F2933]"
                  }`}
                  onClick={() => handleChangePage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              className={`px-3 py-1 rounded-full border border-transparent hover:border-[#4B5563] hover:text-white transition-colors ${
                currentPage === totalPages ? "opacity-40 cursor-default" : ""
              }`}
              disabled={currentPage === totalPages}
              onClick={() => handleChangePage(currentPage + 1)}
            >
              {t("blog.pagination.next")}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;

