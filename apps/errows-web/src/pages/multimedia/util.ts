/**
 * 下载文件
 * @param url 文件URL
 * @param filename 可选的文件名，如果不提供则从URL中提取
 */
export async function download(_url: string, filename?: string) {
  const url = `${_url}?timestamp=${Date.now()}`;
  try {
    // 如果是同源URL，直接使用a标签下载
    const isSameOrigin =
      url.startsWith("/") || url.startsWith(window.location.origin);

    if (isSameOrigin) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 跨域URL，使用fetch下载
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // 从URL或Content-Disposition头中提取文件名
    if (!filename) {
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // 如果还是没有文件名，从URL中提取
      if (!filename) {
        const urlPath = new URL(url, window.location.origin).pathname;
        filename = urlPath.split("/").pop() || "download";
      }
    }

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 清理blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error("Download failed:", error);
    // 降级方案：在新窗口打开
    window.open(url, "_blank");
  }
}

export const ParseCustomParams = (params: { sort: string; tags: string }) => {
  const result: Record<string, string | number | [string, [string]][]> = {};
  const { sort, tags } = params;
  switch (sort) {
    case "latest":
      result.sort = "created_at";
      break;
    case "number":
      result.sort = "count";
      break;
    case "a-z":
      result.sort = "alphabetical";
      result.order = "desc";
      break;
    default:
      break;
  }

  switch (tags) {
    case "futa":
      result.filters = [["tags", ["Futa"]]];
      break;
    case "female":
      result.filters = [["gender", ["Female"]]];
      break;
    case "male":
      result.filters = [["gender", ["Male"]]];
      break;
    case "deleted":
      result.status = "deleted";
      break;
    default:
      break;
  }

  return result;
};
