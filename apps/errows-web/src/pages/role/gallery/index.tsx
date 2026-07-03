/* eslint-disable */
import { RoleGallery } from "./role-gallery";
import { install } from "@/lib/install-service";
import { PostServicesProvider } from "@/pages/post/services";
import { CharacterServicesProvider } from "../services";
import { Wrapper } from "./wrapper";

function RoleGalleryPage() {
  return (
    <Wrapper>
      <RoleGallery />
    </Wrapper> 
  );
}

export default install(RoleGalleryPage, [
  PostServicesProvider,
  CharacterServicesProvider,
]);
