import { request } from '@/apis/request';

/**
 * 上传图片
 * @param file 图片文件
 * @returns 返回图片 URL
 */
export function uploadImageApi(file: File) {  
  return request.post<{ url: string }>('/ops/assets/images', 
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    });
}
