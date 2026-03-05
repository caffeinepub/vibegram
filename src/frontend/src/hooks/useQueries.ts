import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  Comment,
  MediaType,
  Message,
  Notification,
  NotificationId,
  Post,
  UserProfile,
} from "../backend.d";
import type { PostId, UserId } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── User Queries ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !actorFetching && query.isFetched,
  };
}

export function useGetUserProfile(userId: UserId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSearchUsers(prefix: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["searchUsers", prefix],
    queryFn: async () => {
      if (!actor || !prefix.trim()) return [];
      return actor.searchUsers(prefix);
    },
    enabled: !!actor && !isFetching && prefix.trim().length > 0,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      displayName,
    }: {
      username: string;
      displayName: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerUser(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      bio,
      profilePhoto,
    }: {
      displayName: string;
      bio: string;
      profilePhoto: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProfile(displayName, bio, profilePhoto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Post Queries ─────────────────────────────────────────────────────────────

export function useHomeFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["homeFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHomeFeed(BigInt(0), BigInt(20));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExploreFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["exploreFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExploreFeed(BigInt(0), BigInt(20));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserPosts(userId: UserId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["userPosts", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getUserPosts(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetPost(postId: PostId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post | null>({
    queryKey: ["post", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      media,
      mediaType,
      caption,
    }: {
      media: ExternalBlob;
      mediaType: MediaType;
      caption: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(media, mediaType, caption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["exploreFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

// ─── Likes & Comments ─────────────────────────────────────────────────────────

export function usePostLikes(postId: PostId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserId[]>({
    queryKey: ["postLikes", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return [];
      return actor.getPostLikes(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleLike(postId);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({
        queryKey: ["postLikes", postId.toString()],
      });
    },
  });
}

export function usePostComments(postId: PostId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["postComments", postId?.toString()],
    queryFn: async () => {
      if (!actor || !postId) return [];
      return actor.getPostComments(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      text,
    }: {
      postId: PostId;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createComment(postId, text);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: ["postComments", postId.toString()],
      });
    },
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export function useFollowers(userId: UserId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserId[]>({
    queryKey: ["followers", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFollowers(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useFollowing(userId: UserId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserId[]>({
    queryKey: ["following", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFollowing(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followeeId: UserId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.followUser(followeeId);
    },
    onSuccess: (_data, followeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["followers", followeeId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followeeId: UserId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(followeeId);
    },
    onSuccess: (_data, followeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["followers", followeeId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Notification[]>({
    queryKey: ["notifications", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMarkNotificationsAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationIds: NotificationId[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationsAsRead(notificationIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useRecentConversations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserId[]>({
    queryKey: ["recentConversations", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentConversations();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useConversation(otherUserId: UserId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["conversation", otherUserId?.toString()],
    queryFn: async () => {
      if (!actor || !otherUserId) return [];
      return actor.getConversation(otherUserId);
    },
    enabled: !!actor && !isFetching && !!otherUserId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiverId,
      text,
    }: {
      receiverId: UserId;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(receiverId, text);
    },
    onSuccess: (_data, { receiverId }) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", receiverId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["recentConversations"] });
    },
  });
}
