import ai from '@errows/ai';
import { describe, beforeEach, vi, expect, beforeAll } from 'vitest';
import { getJSON, postJSON } from './lib/api.mjs';
import { createComment, delPost, listPosts, mockPost, test } from './fixtures/post.mjs';
import { getPost } from './fixtures/post.mjs';
import { methods as errowsMethods } from '../services/libs/errows.mjs';

const scope = 'errows_posts_test';
import config from 'config';
import { mock_payment_service } from './fixtures/payment.mjs';
import { createRandomCharacter, getCharacter } from './fixtures/character.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';
import { createRandomUser, deleteAccount } from './fixtures/user.mjs';

const avatar_url = 'https://example.com/avatar-for-posts-default.png';
test.scoped({
  scope, avatar_url,
  services: ['user', 'errows', 'api', mock_payment_service]
});

beforeAll(() => {
  vi.spyOn(errowsMethods, 'deductCoinsByImageGen').mockResolvedValue();
});

beforeEach(() => {
  vi.spyOn(ai, 'avatarGen')
  .mockResolvedValue({ image_url: avatar_url });
});

describe('Post', () => {
  test(
    'create post',
    async ({ server, token, character }) => {
      expect(character.social).toHaveProperty('posted_count', 0);

      const { id: cid } = character;
      const post = await mockPost(server, token, cid);
      isPost(post);

      await waitingExpectToBeTrue(
        () => getCharacter(server, cid),
        (character) => {
          expect(character.social).toHaveProperty('posted_count', 1);
        }
      );

      await delPost(server, token, cid, post.id);
      await waitingExpectToBeTrue(
        () => getCharacter(server, cid),
        (character) => {
          expect(character.social).toHaveProperty('posted_count', 0);
        }
      );
    }
  );


});

describe('list post', () => {
  test('list posts by anonymous', async ({ server, post }) => {
    const res = await listPosts(server);
    expect(res).toHaveProperty('count', 1);
    expect(res).toHaveProperty('posts', expect.any(Array));

    const { posts } = res;
    expect(posts[0]).toHaveProperty('id', post.id);

    istPostSummary(posts[0]);
    const postRes = posts[0];
    expect(postRes).toHaveProperty('subject', post.subject);
    expect(postRes).toHaveProperty('images', post.images);
    expect(postRes).toHaveProperty('character', post.character);
    expect(postRes).toHaveProperty('owner', post.owner);
    expect(postRes).toHaveProperty('feedback', null);
  });

  test('list post by character', async ({ server, character, post }) => {
    const res = await getJSON(
      server,
      `/posts`, { query: { cid : character.id } }
    );
    expect(res).toHaveProperty('count', 1);
    istPostSummary(res.posts[0]);
    const postRes = res.posts[0];
    expect(postRes).toHaveProperty('id', post.id);
    expect(postRes.character).toHaveProperty('id', character.id);
  });
});

describe('feedback', () => {
  test('like', async ({ server, token, post }) => {
    const res = await postJSON(
      server, `/posts/${post.id}/feedback/like`,
      { token }
    );
    expect(res).toBeUndefined();

    const likeRes = await getPost(server, post.id);
    expect(likeRes.social).toHaveProperty('likes_count', 1);
    expect(likeRes.social).toHaveProperty('dislikes_count', 0);

    const likeList = await getJSON(server, '/posts', { token });
    expect(likeList.posts[0]).toHaveProperty('feedback', 'like');

    await postJSON(
      server, `/posts/${post.id}/feedback/like`,
      { token }
    );
    const cancelRes = await getPost(server, post.id);
    expect(cancelRes.social).toHaveProperty('likes_count', 0);
    expect(cancelRes.social).toHaveProperty('dislikes_count', 0);
  });

  test('dislike', async ({ server, token, post }) => {
    await postJSON(
      server, `/posts/${post.id}/feedback/dislike`,
      { token }
    );
    const dislikeRes = await getPost(server, post.id);
    expect(dislikeRes.social).toHaveProperty('likes_count', 0);
    expect(dislikeRes.social).toHaveProperty('dislikes_count', 1);

    const dislikeList = await getJSON(server, '/posts', { token });
    expect(dislikeList.posts[0]).toHaveProperty('feedback', 'dislike');

    await postJSON(
      server, `/posts/${post.id}/feedback/dislike`,
      { token }
    );
    const dislikeCancelRes = await getPost(server, post.id);
    expect(dislikeCancelRes.social).toHaveProperty('likes_count', 0);
    expect(dislikeCancelRes.social).toHaveProperty('dislikes_count', 0);
  });

  test('dislike to like', async ({ server, token, post }) => {
    await postJSON(
      server, `/posts/${post.id}/feedback/dislike`,
      { token }
    );
    await postJSON(
      server, `/posts/${post.id}/feedback/like`,
      { token }
    );
    const dislike2like = await getPost(server, post.id);
    expect(dislike2like.social).toHaveProperty('likes_count', 1);
    expect(dislike2like.social).toHaveProperty('dislikes_count', 0);
  });
});

describe('comments', () => {
  test('comment', async ({ server, token, post }) => {
    const res = await createComment(server, token, post.id, 'nice post!');
    expect(res).toHaveProperty('id', expect.any(String));

    const postRes = await getPost(server, post.id);
    isPost(postRes);
    expect(postRes.social).toHaveProperty('comments_count', 1);

    const comment2 = await createComment(
      server, token, post.id, 'reply to comment!', res.id
    );

    const postRes2 = await getPost(server, post.id);
    isPost(postRes2);
    expect(postRes2.comments.length).toBe(2);
    expect(postRes2.comments[1]).toHaveProperty('id', comment2.id);
    expect(postRes2.social).toHaveProperty('comments_count', 2);
  });

});

describe('handle user deleted', () => {
  test(
    'delete posts when user deleted',
    async ({ server, post }) => {
      const randomUser = await createRandomUser(server);
      const randomCharacter = await createRandomCharacter(server, randomUser.token);
      const anotherPost = await mockPost(server, randomUser.token, randomCharacter.id);

      const postList = await listPosts(server);
      expect(postList).toHaveProperty('count', 2);
      const postWillNotDeleted = postList.posts.find((p) => p.id === anotherPost.id);
      expect(postWillNotDeleted).toBeDefined();

      expect(post.comments).toHaveLength(0);
      await createComment(
        server, randomUser.token, post.id, 'comment before user deleted'
      );

      const postWithMessage = await getPost(server, post.id);
      expect(postWithMessage.comments).toHaveLength(1);

      await deleteAccount(server, randomUser.token);

      await waitingExpectToBeTrue(
        () => listPosts(server),
        (res) => {
          expect(res).toHaveProperty('count', 1);
          expect(res.posts[0]).toHaveProperty('id', post.id);
        }
      );

      const postWithDelMessage = await getPost(server, post.id);
      expect(postWithDelMessage.comments).toHaveLength(0);
    }
  );
});

function isPostImage(image) {
  const baseURL = config.assets.baseUrl;
  expect(image).toHaveProperty('id', expect.any(String));
  expect(image).toHaveProperty('url', expect.any(String));
  expect(image.url).toEqual(expect.stringMatching(baseURL));
}

function isPostCharacter(character) {
  expect(character).toHaveProperty('id', expect.any(String));
  expect(character).toHaveProperty('nickname', expect.any(String));
  expect(character).toHaveProperty('avatar_url');
  expect(character).toHaveProperty('gender', expect.any(String));
}

function isPostOwner(user) {
  expect(user).toHaveProperty('id', expect.any(String));
  expect(user).toHaveProperty('name', expect.any(String));
  expect(user).toHaveProperty('avatar', expect.toBeOneOf([expect.any(String), null]));
}

function isPostSocial(social) {
  expect(social).toHaveProperty('likes_count', expect.any(Number));
  expect(social).toHaveProperty('dislikes_count', expect.any(Number));
  expect(social).toHaveProperty('comments_count', expect.any(Number));
}

function istPostSummary(post) {
  expect(post).toHaveProperty('id');
  expect(post).toHaveProperty('subject', expect.any(String));
  expect(post).toHaveProperty('content', expect.any(String));
  expect(post).toHaveProperty('feedback', null);

  expect(post).toHaveProperty('images', expect.any(Array));
  post.images.forEach(isPostImage);
  expect(post).toHaveProperty('character', expect.any(Object));
  isPostCharacter(post.character);
  expect(post).toHaveProperty('owner', expect.any(Object));
  isPostOwner(post.owner);
  expect(post).toHaveProperty('social', expect.any(Object));
  isPostSocial(post.social);
}

function isPost(post) {
  istPostSummary(post);
  expect(post).toHaveProperty('comments', expect.any(Array));
  post.comments.forEach(isPostComment);
}

function isPostComment(comment) {
  expect(comment).toHaveProperty('id', expect.any(String));
  expect(comment).toHaveProperty('content', expect.any(String));
  expect(comment).toHaveProperty('owner', expect.any(Object));
  isPostOwner(comment.owner);
  expect(comment).toHaveProperty('created_at', expect.any(String));
  expect(comment).toHaveProperty('updated_at', expect.any(String));
}