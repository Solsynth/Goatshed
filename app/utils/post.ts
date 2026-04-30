import type { Post } from "~/types/post";

export function getPostIdentifier(post: Post): string {
  if (post.slug && post.publisher?.name) {
    return `${post.publisher.name}/${post.slug}`;
  }
  return post.id;
}

export function getPostIdForApi(post: Post): string {
  if (post.slug && post.publisher?.name) {
    return `${post.publisher.name}/${post.slug}`;
  }
  return post.id;
}
