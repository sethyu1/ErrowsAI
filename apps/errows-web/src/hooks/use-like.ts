import { unlikeCharacterApi, likeCharacterApi, followCharacterApi, unfollowCharacterApi } from "@/apis/character";
import React from "react";
import { toast } from "sonner";

export const useLike = (
  id: string,
  defaultIsLike: boolean,
  defaultCount: number
) => {
  const [liked, setLiked] = React.useState(defaultIsLike);
  const [likesCount, setLikesCount] = React.useState(defaultCount ?? 0);
  const handleLike = async () => {
    try {
      if(!id){
        toast.error("No id");
        return;
      }
      if (liked) {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
        await unlikeCharacterApi(id);
      } else {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
        await likeCharacterApi(id);
      }
    } catch (error) {
      console.error(error);
      setLiked(liked);
      setLikesCount(likesCount);
      toast.error("Failed to like character");
    }
  };
  return { liked, likesCount, handleLike };
};

export const useFollow = (
  id: string,
  defaultIsFollow: boolean,
  defaultCount: number
) => {
  const [followed, setFollowed] = React.useState(defaultIsFollow);
  const [followedCount, setFollowedCount] = React.useState(defaultCount ?? 0);
  const handleFollow = async () => {
    try {
      if(!id){
        toast.error("No id");
        return;
      }
      if(followed){
        setFollowed(false);
        setFollowedCount((prev) => prev - 1);
        await unfollowCharacterApi(id);
      } else {
        setFollowed(true);
        setFollowedCount((prev) => prev + 1);
        await followCharacterApi(id);
      }
    } catch (error) {
      console.error(error);
      setFollowed(followed);
      setFollowedCount(followedCount);
      toast.error("Failed to follow character");
    }
  };
  return { followed, followedCount, handleFollow };
};