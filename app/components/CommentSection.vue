<template>
  <section class="comment-section" data-pagefind-ignore>
    <h3 class="mb-4 text-sm font-semibold text-base-content/70">
      {{ total > 0 ? `${total} 条评论` : '暂无评论' }}
    </h3>

    <div v-if="authenticated" class="comment-composer mb-6">
      <div class="flex gap-3">
        <img
          v-if="currentUserAvatar"
          :src="currentUserAvatar"
          :alt="user?.name || ''"
          class="h-8 w-8 shrink-0 rounded-full object-cover"
        >
        <div v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <textarea
            v-model="newComment"
            :placeholder="replyingTo ? `回复 @${replyingTo.author?.nick || replyingTo.author?.name || '...'}` : '写下你的评论...'"
            class="textarea textarea-bordered textarea-sm w-full resize-none text-sm"
            rows="2"
            maxlength="5000"
            @keydown.ctrl.enter="submitComment"
            @keydown.meta.enter="submitComment"
          />
          <div class="mt-2 flex items-center justify-between">
            <span v-if="replyingTo" class="text-xs text-base-content/50">
              回复 {{ replyingTo.author?.nick || replyingTo.author?.name }}
              <button class="ml-1 text-primary hover:underline" @click="cancelReply">取消</button>
            </span>
            <span v-else />
            <button
              class="btn btn-primary btn-sm"
              :disabled="!newComment.trim() || submitting"
              @click="submitComment"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs" />
              <span v-else>发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="comment-login-prompt mb-6 rounded-xl border border-base-300/40 bg-base-200/30 px-4 py-3 text-center text-sm text-base-content/60">
      <button class="link link-primary" @click="() => login()">登录</button> 后参与评论
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md" />
    </div>

    <div v-else-if="comments.length" class="comment-list space-y-4">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
      >
        <div class="flex gap-3">
          <img
            v-if="comment.author?.avatar"
            :src="comment.author.avatar"
            :alt="comment.author.nick || comment.author.name"
            class="h-8 w-8 shrink-0 rounded-full object-cover"
          >
          <div v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {{ (comment.author?.nick || comment.author?.name || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-medium">{{ comment.author?.nick || comment.author?.name || '匿名' }}</span>
              <span class="text-xs text-base-content/40">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p class="mt-1 text-sm text-base-content/80 whitespace-pre-wrap break-words">{{ comment.content }}</p>
            <div class="mt-2 flex items-center gap-3">
              <button
                v-if="authenticated"
                class="text-xs text-base-content/50 hover:text-primary"
                @click="startReply(comment)"
              >
                回复
              </button>
              <button
                v-if="canDelete(comment)"
                class="text-xs text-base-content/50 hover:text-error"
                @click="deleteComment(comment)"
              >
                删除
              </button>
            </div>

            <div v-if="comment.replies?.length" class="mt-3 space-y-3 border-l-2 border-base-300/30 pl-4">
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="comment-reply"
              >
                <div class="flex gap-2">
                  <img
                    v-if="reply.author?.avatar"
                    :src="reply.author.avatar"
                    :alt="reply.author.nick || reply.author.name"
                    class="h-6 w-6 shrink-0 rounded-full object-cover"
                  >
                  <div v-else class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                    {{ (reply.author?.nick || reply.author?.name || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                      <span class="text-xs font-medium">{{ reply.author?.nick || reply.author?.name || '匿名' }}</span>
                      <span class="text-[10px] text-base-content/40">{{ formatDate(reply.createdAt) }}</span>
                    </div>
                    <p class="mt-0.5 text-xs text-base-content/80 whitespace-pre-wrap break-words">{{ reply.content }}</p>
                    <div class="mt-1 flex items-center gap-3">
                      <button
                        v-if="authenticated"
                        class="text-[10px] text-base-content/50 hover:text-primary"
                        @click="startReply(comment)"
                      >
                        回复
                      </button>
                      <button
                        v-if="canDelete(reply)"
                        class="text-[10px] text-base-content/50 hover:text-error"
                        @click="deleteComment(reply)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasMore && !loading" class="mt-4 text-center">
      <button class="btn btn-ghost btn-sm" :disabled="loadingMore" @click="loadMore">
        <span v-if="loadingMore" class="loading loading-spinner loading-xs" />
        <span v-else>加载更多评论</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Comment } from "~/types/comment";

const props = defineProps<{
  postId: string;
}>();

const { user, authenticated, login } = useAuth();

const comments = ref<Comment[]>([]);
const total = ref(0);
const loading = ref(true);
const loadingMore = ref(false);
const offset = ref(0);
const pageSize = 20;
const hasMore = ref(false);

const newComment = ref("");
const submitting = ref(false);
const replyingTo = ref<Comment | null>(null);

const currentUserAvatar = ref<string | null>(null);
 

async function fetchCurrentUserAvatar() {
  try {
    const data = await $fetch<{ avatarUrl: string | null }>("/api/sn/avatar");
    currentUserAvatar.value = data.avatarUrl;
  } catch {
    // fallback to nothing
  }
}

async function fetchComments(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const data = await $fetch<{ comments: Comment[]; total: number }>(
      `/api/posts/${props.postId}/comments`,
      { query: { take: pageSize, offset: offset.value } },
    );

    if (isLoadMore) {
      comments.value.push(...data.comments);
    } else {
      comments.value = data.comments;
    }
    total.value = data.total;
    hasMore.value = offset.value + data.comments.length < data.total;
  } catch (e) {
    console.error("Failed to fetch comments:", e);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  offset.value += pageSize;
  fetchComments(true);
}

async function submitComment() {
  if (!newComment.value.trim() || submitting.value) return;

  submitting.value = true;
  try {
    const comment = await $fetch<Comment>(`/api/posts/${props.postId}/comments`, {
      method: "POST",
      body: {
        content: newComment.value.trim(),
        parentId: replyingTo.value?.id || null,
      },
    });

    replyingTo.value = null;
    comments.value.unshift(comment);
    total.value++;
    newComment.value = "";
  } catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { message?: string } }
    if (err.statusCode === 401 || err.statusCode === 403) {
      void login();
    } else {
      console.error("Failed to post comment:", e);
    }
  } finally {
    submitting.value = false;
  }
}

function startReply(comment: Comment) {
  replyingTo.value = comment;
}

function cancelReply() {
  replyingTo.value = null;
}

async function deleteComment(comment: Comment) {
  try {
    await $fetch(`/api/comments/${comment.id}`, { method: "DELETE" });

    if (comment.parentId) {
      const parent = comments.value.find((c) => c.id === comment.parentId);
      if (parent?.replies) {
        parent.replies = parent.replies.filter((r) => r.id !== comment.id);
      }
    } else {
      comments.value = comments.value.filter((c) => c.id !== comment.id);
      total.value--;
    }
  } catch (e) {
    console.error("Failed to delete comment:", e);
  }
}

function canDelete(comment: Comment): boolean {
  if (!authenticated.value) return false;
  const currentUser = user.value as (typeof user.value & { isAdmin?: boolean | null }) | null;
  return comment.authorId === user.value?.id || !!currentUser?.isAdmin;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}

onMounted(() => {
  fetchComments();
  if (authenticated.value) {
    fetchCurrentUserAvatar();
  }
});
</script>
