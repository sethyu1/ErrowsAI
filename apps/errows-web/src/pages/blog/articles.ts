export interface BlogSection {
  heading?: string;
  body: string;
}

export interface BlogArticle {
  /** 唯一 ID，用于路由匹配 */
  id: string;
  /** 标题 */
  title: string;
  /** 发布时间文案 */
  date: string;
  /** 简短摘要 */
  summary: string;
  /** 阅读时长（分钟），用于多语言渲染，例如 8 -> \"8 min read\" */
  readTimeMinutes?: number;
  /** 文章所属分类 Key，用于多语言渲染，例如 \"guides\" */
  categoryKey?: "guides" | "safety" | "workflow" | "review";
  /** 列表/详情顶部使用的封面图 */
  cover: string;
  /** 正文分段内容 */
  sections: BlogSection[];
}

import blogCover1 from "../about-us/assets/blog/1c2269854a2b53c795ffa2760aa43628.webp";
import blogCover2 from "../about-us/assets/blog/604c2d3d59c7d34d052cbda5743b95dc.webp";
import blogCover3 from "../about-us/assets/blog/79a9576f12d5ce0331fc85da27345965.webp";
import blogCover4 from "../about-us/assets/blog/8b775dc800ea85a1a16e40114317486d.webp";

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "grok-nsfw-policy",
    title: "Does Grok Allow NSFW Content? Here's What We Found",
    date: "October 30, 2025",
    readTimeMinutes: 8,
    categoryKey: "guides",
    summary:
      "We tested Grok in chat and image generation to understand how it handles NSFW content, and where moderation still feels inconsistent.",
    cover: blogCover1,
    sections: [
      {
        heading: "Quick Summary",
        body:
          "In this guide, we put Grok's NSFW handling through a series of practical tests: from mildly suggestive prompts to explicit edge cases. " +
          "Our goal wasn't to bypass safety systems, but to understand how predictable the experience is for creators who work close to the boundary. " +
          "We found that Grok can sometimes return surprisingly direct outputs, while still blocking very similar prompts with only minor wording changes.",
      },
      {
        heading: "How Consistent Is Grok's Moderation?",
        body:
          "The biggest challenge we observed is inconsistency. The same creative intent—say, a mature romance scene—might pass in one wording and fail in another. " +
          "This makes it hard for professional creators to build reliable workflows, especially when they need to reproduce a specific style or scene across multiple iterations.",
      },
      {
        heading: "Where Errows Fits In",
        body:
          "Errows takes a different approach: instead of relying on a single opaque filter, we offer clearer boundaries, multi-character support, and more transparent controls. " +
          "For teams that need stable, long‑term production pipelines, being able to predict what the model will and will not generate is often more important than pushing the absolute limits.",
      },
    ],
  },
  {
    id: "deepsk-nsfw-jailbreak",
    title: "DeepSeek NSFW Jailbreak: Is It Possible and Should You Try It?",
    date: "October 30, 2025",
    readTimeMinutes: 9,
    categoryKey: "safety",
    summary:
      "We look at the most common jailbreak tricks for DeepSeek, why they 'work' in the short term, and the real risks for both creators and platforms.",
    cover: blogCover2,
    sections: [
      {
        heading: "What Jailbreaking Really Means",
        body:
          "Most jailbreak prompts don't actually switch off safety systems—they just confuse the model long enough to get one or two borderline responses through. " +
          "That fragility means you can never rely on the model for serious production work, and every update can silently break your workflow.",
      },
      {
        heading: "Risks for Creators",
        body:
          "Trying to consistently bypass safeguards can put your account, audience, and brand at risk. " +
          "Platforms may retroactively clamp down on content, or silently shadow‑limit creators who sit too close to the edge for too long.",
      },
    ],
  },
  {
    id: "write-short-story-with-Errows",
    title: "Here's How to Write a Short Story from Start to Finish with Errows",
    date: "October 30, 2025",
    readTimeMinutes: 7,
    categoryKey: "workflow",
    summary:
      "From character seeds to final polish, this walkthrough shows a practical workflow for shipping a complete short story in one sitting.",
    cover: blogCover3,
    sections: [
      {
        heading: "From Idea to Cast",
        body:
          "Start with a simple premise, then use Errows to spin up a cast sheet: names, personality hooks, and a few grounding details for each character. " +
          "Those anchors keep the model consistent, even across longer scenes and complex relationship arcs.",
      },
      {
        heading: "Iterate in Scenes, Not Sentences",
        body:
          "Instead of micro‑editing every reply, work scene by scene. Let the model draft, then use targeted instructions to tighten pacing, adjust tone, or rewrite individual beats.",
      },
    ],
  },
  {
    id: "ai-girlfriend-apps-review",
    title: "We Tested 8 Top AI Girlfriend Apps for Virtual Companionship",
    date: "October 30, 2025",
    readTimeMinutes: 10,
    categoryKey: "review",
    summary:
      "A hands‑on comparison of popular AI companion apps—their strengths, limitations, and where Errows aims to push the experience further.",
    cover: blogCover4,
    sections: [
      {
        heading: "What Makes a Good Companion App?",
        body:
          "Most apps can hold a basic conversation; the hard part is long‑term memory, emotional continuity, and respecting personal boundaries. " +
          "We evaluated each product not just on moment‑to‑moment replies, but on how it handled weeks‑long interactions.",
      },
      {
        heading: "Why Reliability Matters More Than Novelty",
        body:
          "Flashy features are easy to demo, but the real magic is a companion that remembers, adapts, and feels stable over time. " +
          "That's where infrastructure, safety, and good product design matter as much as raw model power.",
      },
    ],
  },
];


