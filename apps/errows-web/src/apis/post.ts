import { request } from "@/apis/request";

// ============ Post 列表查询 ============

/** 获取 Post 列表参数 */
export interface FetchPostsParams {
  /** 角色 ID，过滤该角色的 post 列表 */
  cid?: string;
  /** 页码，默认 0 */
  page?: number;
  /** 每页数量，默认 10 */
  size?: number;
}

/** post 列表 */
export const fetchPostsApi = async (params: FetchPostsParams) => {
  const result = await request.get<{
    count: number;
    posts: API.POST.POST[];
  }>("/posts", {
    params,
  });
  return {
    count: result.count,
    data: result.posts,
  };
};

/** 查询 post 详情 */
export const getPostApi = (pid: string) => {
  return request.get<API.POST.POST>(`/posts/${pid}`);
};

// ============ 图片上传 ============

/** 从本地为角色上传图片 */
export const uploadPostImageApi = (cid: string, file: File) => {
  return request.post<API.POST.POST_IMAGE>(
    `/my/characters/${cid}/post/images`,
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    }
  );
};

// ============ Post CRUD ============

/** 创建角色 post 参数 */
export interface CreatePostParams {
  /** post 文本内容 */
  content: string;
  /** post 图片 ID 列表 */
  images: string[];
}

/** 创建角色 post */
export const createPostApi = (cid: string, data: CreatePostParams) => {
  return request.post<{ id: string }>(`/my/characters/${cid}/posts`, data);
};

/** 更新角色 post */
export const updatePostApi = (
  cid: string,
  pid: string,
  data: CreatePostParams
) => {
  return request.put(`/my/characters/${cid}/posts/${pid}`, data);
};

/** 删除角色 post */
export const deletePostApi = (cid: string, pid: string) => {
  return request.delete(`/my/characters/${cid}/posts/${pid}`);
};

// ============ Post 互动 ============

/** post feedback 点赞/点踩 */
export const postFeedbackApi = (pid: string, feedback: "like" | "dislike") => {
  return request.post(`/posts/${pid}/feedback/${feedback}`);
};

// ============ Post 评论 ============

/** post 留言参数 */
export interface CreateCommentParams {
  /** 留言内容 */
  content: string;
  /** 可选，回复的留言 ID */
  reply_to_id?: string;
}

/** post 留言 */
export const createCommentApi = (pid: string, data: CreateCommentParams) => {
  return request.post<{ id: string }>(`/posts/${pid}/comments`, data);
};
