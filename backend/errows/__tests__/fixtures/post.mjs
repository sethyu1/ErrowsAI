import {
  deleteJSON, getJSON, postJSON, postStreamJSON
} from '../lib/api.mjs';
import {
  random_integer, random_text,
  random_gen_image_stream
} from '../lib/utils.mjs';
import { test as characterTest } from './character.mjs';

export async function createPost(
  server, token, cid, subject, content, images
) {

  const post = await postJSON(
    server,
    `/my/characters/${cid}/posts`,
    { body: { subject, content, images }, token }
  );

  return post;
}

export async function getPost(
  server, pid
) {
  const post = await getJSON(
    server,
    `/posts/${pid}`
  );

  return post;
}

export async function delPost(
  server, token, cid, pid
) {
  await deleteJSON(
    server,
    `/my/characters/${cid}/posts/${pid}`,
    { token }
  );
}

export async function mockRandomPostImages(
  server, token, cid
) {
  const images = [];

  for (let i = 0; i < random_integer(9, 1); i++) {
    const image = random_gen_image_stream();
    const res = await postStreamJSON(
      server, `/my/characters/${cid}/post/images`, {
        token,
        body: image
      }
    );

    images.push(res);
  }

  return images;
}

export async function listPosts(
  server, query = { page: 0, size: 10 }
) {
  return getJSON(server, '/posts', { query });
}

export async function mockPost(server, token, cid, images = []) {
  const subject = `Post Subject ${random_text(5)}`;
  const content = `Post Content ${random_text(20)}`;
  images = [].concat(images);
  if (images.length === 0) {
    const mockImages = await mockRandomPostImages(server, token, cid);
    images.push(...mockImages.map(img => img.id));
  }

  const { id } = await createPost(
    server, token, cid, subject, content, images
  );

  return getPost(server, id);
}

export async function createComment(
  server, token, pid, content, reply_to_id = null
) {
  return postJSON(
    server,
    `/posts/${pid}/comments`,
    { token, body: { content, reply_to_id } }
  );
}

export const test = characterTest.extend({
  post_images: async ({ server, character, token }, use) => {
    const images = await mockRandomPostImages(
      server, token, character.id
    );
    await use(images);
  },
  post: async ({ server, token, character, post_images }, use) => {
    const cid = character.id;

    const post = await mockPost(
      server, token, cid,
      post_images.map(img => img.id)
    );

    await use(post);

    await delPost(server, token, cid, post.id);
  },
});