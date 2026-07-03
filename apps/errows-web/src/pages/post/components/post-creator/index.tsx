import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Field,
  FieldTitle,
  Textarea,
  Button,
} from "@errows/design";
import { fetchMyCharactersApi } from "@/apis/character";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components";
import { Transfer } from "../transfer";
import type { CreatePostParams } from "@/apis/post";
import type { PostData } from "../../services";
import { cn } from "@errows/design/lib/utils";
import { fetchMyCharacterImagesByCidApi } from "@/apis/character";

interface PostCreatorProps {
  className?: string;
  data: PostData;
  onSubmit?: (cid: string, data: CreatePostParams & { pid?: string }) => void;
  submitting?: boolean;
  roleParams?: any;
}

export const useMyCharacters = (roleParams?: any) => {
  const { data, isLoading, error } = useQuery<{
    data: API.Character.CHARACTER[];
  }>({
    queryKey: ["my-characters", roleParams],
    queryFn: () => fetchMyCharactersApi("owned", roleParams ? {
      ...roleParams,
      size: 100
    } : {}),
  });

  return { characters: data?.data || [], isLoading, error };
};

export const useMyCharacterImages = (cid: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["myCharacterImages", cid],
    queryFn: async () => {
      return await fetchMyCharacterImagesByCidApi(cid);
    },
    enabled: !!cid,
  });

  return { images: data?.data || [], isLoading, error };
};

const MAX_CONTENT_LENGTH = 600;

export const PostCreator: React.FC<PostCreatorProps> = ({
  className,
  data,
  onSubmit,
  submitting,
  roleParams,
}) => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<string>(data?.cid);
  const [content, setContent] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);

  const { characters, isLoading } = useMyCharacters(roleParams);

  const { images, isLoading: imagesLoading } =
    useMyCharacterImages(selectedUser);

  //同步一下
  React.useEffect(() => {
    setSelectedUser(data?.cid);
    setContent(data?.data?.content ?? "");
    setSelectedMedia(data?.data?.images ?? []);
  }, [data?.cid]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
    }
  };

  const handleSubmit = () => {
    onSubmit?.(selectedUser, {
      pid: data.data?.id,
      content,
      images: selectedMedia.map((m) => m.id),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide relative">
      <div className={cn("flex flex-col gap-6 ", className)}>
        {/* User Select */}
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("post.selectCharacter")}>
              {selectedUser && (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={
                        characters?.find((c: any) => c.id === selectedUser)
                          ?.avatar_url
                      }
                    />
                    <AvatarFallback>
                      {
                        characters?.find((c: any) => c.id === selectedUser)
                          ?.nickname?.[0]
                      }
                    </AvatarFallback>
                  </Avatar>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {
                      characters?.find((c: any) => c.id === selectedUser)
                        ?.nickname
                    }
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-[10001]">
            {characters?.map((character) => (
              <SelectItem key={character.id} value={character.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={character.avatar_url} />
                    <AvatarFallback>{character.nickname?.[0]}</AvatarFallback>
                  </Avatar>
                  <span>{character.nickname}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content Field */}
        <Field>
          <FieldTitle>{t("post.content")}</FieldTitle>
          <div className="relative">
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder={t("post.enterPostContent")}
              className="min-h-[120px] pr-36"
            />
            <span className="absolute right-3 bottom-3 text-sm text-muted-foreground">
              {content?.length}/{MAX_CONTENT_LENGTH} {t("post.characters")}
            </span>
          </div>
        </Field>

        {/* Media Transfer */}
        <Field>
          {/* <FieldTitle>Multimedia</FieldTitle> */}
          <Transfer
            characterId={selectedUser}
            availableMedia={images}
            selectedMedia={selectedMedia}
            onSelectedChange={setSelectedMedia}
          />
        </Field>

        <div className="flex w-full justify-center">
          <Button
            appearance="gradientFill"
            shape="round"
            className="w-60"
            loading={submitting}
            onClick={handleSubmit}
            disabled={
              submitting ||
              content?.length === 0 ||
              selectedMedia?.length === 0
            }
          >
            {data?.data?.id ? t("post.updatePost") : t("post.createPost")}
          </Button>
        </div>
      </div>
    </div>
  );
};
