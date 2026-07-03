import { request } from "@/apis/request";

interface SupportFormData {
  email: string;
  type: string;
  description: string;
}

export const submitSupportRequest = async (formData: SupportFormData) => {
  return request.post("/supports", formData);
};
