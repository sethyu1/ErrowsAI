import { request } from "@/apis/request";

/** Notion 博客文章图片 */
export interface NotionBlogImage {
  url: string;
  caption: string | null;
}

/** Notion 博客文章 */
export interface NotionBlogArticle {
  id: string;
  title: string;
  thumbnail: string | null;
  date: string | null;
  description?: string | null;
  content: string;
  contentHtml?: string | null;
  images?: NotionBlogImage[];
}

/** 获取 Notion 博客文章列表参数 */
export interface FetchNotionBlogParams {
  /** 获取的文章数量，默认 3 */
  limit?: number;
}

/** 获取 Notion 博客文章列表 */
export const fetchNotionBlogApi = async (params?: FetchNotionBlogParams) => {
  const result = await request.get<NotionBlogArticle[]>("/notion/blog", {
    params,
  });
  return result;
};

/** 获取 Notion 博客文章详情 */
export const fetchNotionBlogDetailApi = async (pageId: string) => {
  const result = await request.get<NotionBlogArticle>(`/notion/blog/${pageId}`);
  return result;
};
