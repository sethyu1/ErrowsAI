import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "../about-us/components/footer";
import { fetchNotionBlogDetailApi, type NotionBlogArticle } from "@/apis/notion";

const BlogDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = React.useState<NotionBlogArticle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      navigate(-1);
      return;
    }

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchNotionBlogDetailApi(id);
        setArticle(data);
      } catch (err: any) {
        console.error('Failed to fetch article:', err);
        setError(err?.message || 'Failed to load article');
        // 3秒后返回上一页
        setTimeout(() => {
          navigate(-1);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate]);

  React.useEffect(() => {
    if (!article) return;

    document.title = `${article.title} | Errows Blog`;
    const desc = article.description || article.content?.substring(0, 160) || article.title;

    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('name', 'description', desc);
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:title', article.title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', window.location.href);
    if (article.thumbnail) setMeta('property', 'og:image', article.thumbnail);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', article.title);
    setMeta('name', 'twitter:description', desc);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: desc,
      url: window.location.href,
      ...(article.date && { datePublished: article.date }),
      ...(article.thumbnail && { image: article.thumbnail }),
      author: { '@type': 'Organization', name: 'Errows' },
      publisher: { '@type': 'Organization', name: 'Errows', url: window.location.origin },
    };

    let script = document.getElementById('blog-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'blog-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'errows';
      document.getElementById('blog-jsonld')?.remove();
    };
  }, [article]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0A] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#9CA3AF]">{t("common.loading") || "Loading..."}</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="w-full min-h-screen bg-[#090A0A] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#9CA3AF] mb-4">{error || "Article not found"}</div>
          <button
            onClick={() => navigate(-1)}
            className="text-[#C9C1FF] hover:text-white transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090A0A] text-[#F5F5F5] flex flex-col overflow-y-auto">
      <style>{`
        .notion-article .notion-content { margin-bottom: 1.5rem; }
        .notion-article .notion-content:last-child { margin-bottom: 0; }
        .notion-article .notion-paragraph { margin: 0 0 0.75rem; line-height: 1.75; }
        .notion-article .notion-heading_1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.5rem; line-height: 1.3; color: #F9FAFB; }
        .notion-article .notion-heading_2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; line-height: 1.4; color: #F9FAFB; }
        .notion-article .notion-heading_3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; line-height: 1.4; color: #F9FAFB; }
        .notion-article .notion-bulleted_list_item, .notion-article .notion-numbered_list_item { margin: 0.25rem 0; padding-left: 1rem; list-style: disc; }
        .notion-article .notion-inline-code { font-family: ui-monospace, monospace; font-size: 0.9em; padding: 0.15em 0.4em; border-radius: 4px; background: rgba(255,255,255,0.08); }
        .notion-article a { color: #C9C1FF; text-decoration: underline; }
        .notion-article .notion-table-wrap { width: 100%; overflow-x: auto; margin: 1rem 0; -webkit-overflow-scrolling: touch; }
        .notion-article .notion-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; line-height: 1.5; }
        .notion-article .notion-table th,
        .notion-article .notion-table td { border: 1px solid rgba(255,255,255,0.12); padding: 0.5rem 0.65rem; text-align: left; vertical-align: top; }
        .notion-article .notion-table th { background: rgba(255,255,255,0.05); color: #F9FAFB; font-weight: 600; }
        .notion-article .notion-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }
        .notion-article .notion-toc { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem 1.25rem; margin: 1.5rem 0; }
        .notion-article .notion-toc ul { list-style: none; margin: 0; padding: 0; }
        .notion-article .notion-toc ul::before { content: "Contents"; display: block; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #6B7280; margin-bottom: 0.5rem; }
        .notion-article .notion-toc-item { margin: 0.2rem 0; line-height: 1.5; }
        .notion-article .notion-toc-level-1 { padding-left: 0; }
        .notion-article .notion-toc-level-2 { padding-left: 1rem; }
        .notion-article .notion-toc-level-3 { padding-left: 2rem; }
        .notion-article .notion-toc a { color: #9CA3AF; text-decoration: none; font-size: 0.875rem; }
        .notion-article .notion-toc a:hover { color: #C9C1FF; }
        .notion-article h1[id], .notion-article h2[id], .notion-article h3[id] { scroll-margin-top: 80px; }
      `}</style>
      <div className="px-[96px] pt-[110px] pb-16 max-sm:px-4 max-sm:pt-[88px]">
        {/* 标题与 Meta */}
        <div className="max-w-3xl">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase text-[#9CA3AF] mb-3">
            {t("blog.pageTitle")}
          </div>
          <h1 className="text-[40px] leading-[48px] font-bold mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#A4ACB9] mb-6">
            {article.date && (
              <span>
                {(() => {
                  try {
                    const date = new Date(article.date);
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  } catch (e) {
                    return article.date;
                  }
                })()}
              </span>
            )}
          </div>
        </div>

        <article className="max-w-3xl text-base leading-7 text-[#E5E7EB] space-y-6 notion-article">
          {article.contentHtml ? (() => {
            const segments = article.contentHtml.split(/(\[IMAGE:\d+\])/);
            return segments.map((segment, index) => {
              const imgMatch = segment.match(/\[IMAGE:(\d+)\]/);
              if (imgMatch && article.images) {
                const imgIdx = parseInt(imgMatch[1]);
                const image = article.images[imgIdx];
                if (!image) return null;
                return (
                  <div key={`img-${index}`} className="my-8">
                    <img
                      src={image.url}
                      alt={image.caption || article.title}
                      className="w-full rounded-xl border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {image.caption && (
                      <p className="text-sm text-[#9CA3AF] mt-2 text-center">
                        {image.caption}
                      </p>
                    )}
                  </div>
                );
              }
              if (!segment.trim()) return null;
              return (
                <div
                  key={`html-${index}`}
                  className="notion-content leading-7"
                  dangerouslySetInnerHTML={{ __html: segment }}
                />
              );
            });
          })() : (() => {
            if (!article.content) return null;
            const parts: Array<{ type: 'text' | 'image'; content: string; imageIndex?: number }> = [];
            const paragraphs = article.content.split('\n\n');

            paragraphs.forEach((paragraph) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return;
              const imageMatch = trimmed.match(/^\[IMAGE:(\d+)\]$/);
              if (imageMatch && article.images) {
                const imgIdx = parseInt(imageMatch[1]);
                if (article.images[imgIdx]) {
                  parts.push({
                    type: 'image',
                    content: article.images[imgIdx].url,
                    imageIndex: imgIdx,
                  });
                }
              } else {
                const hasImagePlaceholder = /\[IMAGE:\d+\]/.test(trimmed);
                if (hasImagePlaceholder && article.images) {
                  const segs = trimmed.split(/(\[IMAGE:\d+\])/);
                  segs.forEach((seg) => {
                    const m = seg.match(/\[IMAGE:(\d+)\]/);
                    if (m) {
                      const idx = parseInt(m[1]);
                      if (article.images![idx]) {
                        parts.push({ type: 'image', content: article.images![idx].url, imageIndex: idx });
                      }
                    } else if (seg.trim()) {
                      parts.push({ type: 'text', content: seg.trim() });
                    }
                  });
                } else {
                  parts.push({ type: 'text', content: trimmed });
                }
              }
            });

            return parts.map((part, index) => {
              if (part.type === 'image') {
                const image = article.images?.[part.imageIndex!];
                if (!image) return null;
                return (
                  <div key={`image-${index}`} className="my-8">
                    <img
                      src={image.url}
                      alt={image.caption || article.title}
                      className="w-full rounded-xl border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {image.caption && (
                      <p className="text-sm text-[#9CA3AF] mt-2 text-center">
                        {image.caption}
                      </p>
                    )}
                  </div>
                );
              }
              const isHeading = part.content.length < 100 && !part.content.includes('.') && part.content.length > 0;
              return (
                <div key={`text-${index}`} className={isHeading ? "space-y-3" : ""}>
                  {isHeading ? (
                    <h2 className="text-xl font-semibold text-[#F9FAFB]">
                      {part.content}
                    </h2>
                  ) : (
                    <p className="leading-7 whitespace-pre-wrap">{part.content}</p>
                  )}
                </div>
              );
            });
          })()}
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetail;

