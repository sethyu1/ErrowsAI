import React from "react";
import { fetchCharacterDetailApi } from "@/apis/character";

export const useCharacter = (cid?: string) => {
  const [loading, setLoading] = React.useState(false);
  const [character, setCharacter] = React.useState<API.Character.CHARACTER>();
  React.useEffect(() => {
    (async function () {
      try {
        if (!cid) {
          return;
        }
        setLoading(true);
        const character = await fetchCharacterDetailApi(cid);
        setCharacter(character);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [cid]);

  return {
    loading,
    character,
  };
};
