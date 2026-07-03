/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./common.d.ts" />

declare namespace API {
  namespace Character {
    interface CHARACTER_IDENTITY {
      nickname: string; // 昵称
      description: string; // 描述
      introduction: string; // 介绍
      gender: "male" | "female"; // 性别
      type: "anime" | "realistic"; // 角色类型
      assortment: string; // 种族
      color: string; // 颜色
      age: string; // 年龄
      updated_at?: string; // 更新时间
    }

    interface CHARACTER_SETTING {
      identity: CHARACTER_IDENTITY;
      style: {
        voice: string; // 声音 id
        eye_color: string; // 眼睛颜色
        hair_style: string; // 发型
        hair_length: string; // 发长度
        hair_bangs: string; // 刘海
        hair_color: string; // 发色
        body_type: string; // 体型
        breast_size: string; // 胸部大小
        butt_size: string; // 臀部大小
        tags: string[]; // 标签
        s_tags: string[];
      };
      dialogue: {
        settings: string; // 角色设定
        greeting: string; // 角色问候语
        personality: string; // 角色个性
        scenario: string; // 角色场景,
        examples: {
          user: string; // 用户示例对话
          character: string; // 角色示例对话
        }[]; // 角色示例对话
      };
    }

    interface CHARACTER extends CHARACTER_IDENTITY {
      id: string; // 角色 ID
      owner: CHARACTER_OWNER; // 角色拥有者
      avatar_url: string; // 角色头像 URL
      first_background_image_url?: string | null;
      greeting_image?: string | null; // 问候图路径
      background_image_files?: string | null; // 背景图路径(逗号分隔)
      ncover?: number | null;
      status:
        | "pending" // 待生成
        | "generating" // 生成中
        | "private" // 私密
        | "public" // 公开
        | "deleted"; // 已删除
      liked: boolean; // 当前用户是否已点赞
      followed: boolean; // 当前用户是否已关注
      social: {
        comments_count: number; // 评论数
        likes_count: number; // 点赞数
        followed_count: number; // 关注数
        posted_count: number; // 发布数
        dialogues_count: number; // 对话数
        video_count: number; // 视频数
        intimacy_score: number; // 亲密度分数
      };
      created_at: string; // 创建时间
      updated_at: string; // 更新时间
    }

    interface CHARACTER_LIST_PARAMS_BASE {
      page: number; // 页码，默认 0
      size: number; // 每页数量，默认 10
      sort: "popular" | "newest" | "most_liked" | "alphabetical" | "latest";
      q: string; // 搜索关键词
    }

    type CHARACTER_LIST_PARAMS = Partial<
      CHARACTER_LIST_PARAMS_BASE & {
        // 同一类 tag 可以有多值，或关系，不同类 tag 之间是与关系
        tags: { type: string; value: string[] }[];
        category: "male" | "female" | "futa"; // 类别筛选
        type: "anime" | "realistic" | "errows"; // 角色类型
      }
    >;

    /** 角色设置信息 */
    interface Setting {
      /** 昵称 */
      nickname: string;
      /** 描述 */
      description: string;
      /** 性别 */
      gender: Common.Gender;
      /** 角色类型 */
      type: "anime" | "realistic";
      /** 种族 */
      assortment: string;
      /** 颜色 */
      color: string;
      /** 种族 */
      race: string;
      /** 年龄 */
      age: string;
      /** 声音 id */
      voice: string;
      /** 眼睛颜色 */
      eye_color: string;
      /** 发型 */
      hair_style: string;
      /** 发长度 */
      hair_length: string;
      /** 刘海 */
      hair_bangs: string;
      /** 发色 */
      hair_color: string;
      /** 体型 */
      body_type: string;
      /** 胸部大小 */
      breast_size: string;
      /** 臀部大小 */
      butt_size: string;
      /** dick */
      penis_size?: string;
      /** 标签 */
      tags: string[];
      /** 角色设定 */
      settings: string;
      /** 角色问候语 */
      greeting: string;
      /** 角色个性 */
      personality: string;
      /** 角色场景 */
      scenario: string;
      /** 角色示例对话 */
      examples: {
        user: string;
        character: string;
      }[];
    }

    /** 列表项信息 */
    interface ListItem {
      /** 角色 ID */
      id: string;
      /** 头像 URL */
      avatar_url: string;
      /** 问候图路径 */
      greeting_image?: string | null;
      /** 背景图路径(逗号分隔) */
      background_image_files?: string | null;
      /** 昵称 */
      nickname: string;
      /** 描述 */
      description: string;
      /** 介绍 */
      introduction?: string;
      /** 年龄 */
      age: string;
      /** 种族/分类 */
      assortment?: string;
      /** 角色类型 */
      type?: "anime" | "realistic";
      /** 肤色 */
      color?: string;
      /** 性别 */
      gender?: Common.Gender;
      /** 状态 */
      status: "pending" | "generating" | "private" | "public" | "deleted";
      /** 所有者 ID */
      owner_id?: string;
      /** 创建时间 */
      created_at?: string;
      /** 更新时间 */
      updated_at?: string;
      social: {
        /** 评论数 */
        comments_count: number;
        /** 点赞数 */
        likes_count: number;
        /** 关注数 */
        followed_count: number;
        /** 发布数 */
        posted_count: number;
        /** 对话数 */
        dialogues_count: number;
        /** 视频数 */
        video_count: number;
        /** 亲密度分数 */
        intimacy_score: number;
      };
    }

    // ======================== 角色列表 ========================
    interface FetchListParams extends Common.PaginationParams {
      sort?: | 'default' | 'popular' | 'newest' | 'most_liked' | 'alphabetical' | 'latest' | 'created_at';
      q?: string // 搜索关键词
      tags?: [string, string[]][];
      recommended?: boolean;
    }

    /** 查询富媒体 图片列表 */
    type FetchMediaListParams = Record<string, string | number>;


    /** 图片配置 */
    interface ImageGenerationOptions {
      gender: "female" | "male";
      key: string;
      title: string;
      max_select: number;
      min_select: number;
      options: {
        value: string;
        url: string;
        prompts: string[];
      }[];
    }

    /** 角色生图配置项 */
    interface ImageGenSetting {
      outfit: string[]; // 服装
      action: string[]; // 动作
      background: string[]; // 背景
      prompt?: string | null; // 用户自定义提示词
      //
      bacground?: string[];
    }

    /** 角色摘要信息 */
    interface CharacterSummary {
      id: string; // 角色 ID
      nickname: string; // 角色昵称
      avatar_url: string; // 角色头像 URL
      gender: string; // 角色性别
    }

    /** 图片资源基础信息 */
    interface AssetBase {
      id: string; // 图片 ID
      url: string; // 图片 URL
      created_at: string; // 创建时间
      generated_at: string; // 生成时间
    }

    /** 图片资源 */
    interface AssetImage extends AssetBase {
      video_status?:
        | null
        | "pending"
        | "generating"
        | "completed"
        | "failed";
      video?: null | AssetBase; // 关联视频媒体信息
    }

    /** 视频资源 */
    interface AssetVideo extends AssetBase {
      cover: string; // 视频封面图 URL
    }

    /** 图片媒体摘要 */
    interface AssetImageSummary {
      character: CharacterSummary; // 角色信息
      count: number; // 该角色图片数量
      cover: string; // 该角色封面图片
      cid: string;
      url: string; // 图片或者视频播放地址
    }

    /** 生图任务状态 */
    type ImageGenTaskStatus =
      | "pending" // 排队
      | "generating" // 生成中
      | "completed" // 任务完成
      | "failed"; // 任务失败

    /** 生图任务状态响应 */
    interface ImageGenTaskStatusResponse {
      status: ImageGenTaskStatus;
      cid: string;
      asset: null | AssetImage;
      id: string;
      setting?: API.Character.ImageGenSetting;
      created_at: string;
    }

    /** 某个角色生成未完成的视频任务状态 */
    interface VideoGenTaskStatusResponse {
      status: ImageGenTaskStatus;
      // 任务id
      id: string;
      image_id: string;
      cover: string;
      created_at: string;
      updated_at: string;
      uid: string;
      asset: null | AssetVideo; // 任务完成后返回视频媒体信息
    }
  }
}
