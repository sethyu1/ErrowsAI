import { postFeedbackApi } from "@/apis/post";
import React from "react";
import { toast } from "sonner";

export const usePostFeedback = (
  pid: string,
  defaultFeedback: "like" | "dislike",
  defaultCount: number
) => {
  const [feedback, setFeedback] = React.useState(defaultFeedback);
  const [count, setCount] = React.useState(defaultCount);
  const handleFeedback = async () => {
    try {
      if (!pid) {
        toast.error("No id");
        return;
      }
      if (feedback === "like") {
        setFeedback("dislike");
        setCount((prev) => prev - 1);
        await postFeedbackApi(pid, "dislike");
      } else {
        setFeedback("like");
        setCount((prev) => prev + 1);
        await postFeedbackApi(pid, "like");
      }
    } catch (error) {
      console.error(error);
      setFeedback(feedback);
      setCount(count);
      toast.error("Failed to feedback post");
    }
  };
  return { feedback, count, handleFeedback };
};
