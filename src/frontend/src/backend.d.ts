import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Comment {
    authorId: UserId;
    createdAt: Time;
    text: string;
    postId: PostId;
}
export type PostId = bigint;
export type UserId = Principal;
export type MessageId = bigint;
export interface Post {
    id: PostId;
    media: ExternalBlob;
    authorId: UserId;
    createdAt: Time;
    caption: string;
    mediaType: MediaType;
}
export type NotificationId = bigint;
export interface Notification {
    id: NotificationId;
    createdAt: Time;
    read: boolean;
    type: NotificationType;
    actorId: UserId;
    recipientId: UserId;
    postId?: PostId;
}
export interface Message {
    id: MessageId;
    createdAt: Time;
    text: string;
    receiverId: UserId;
    senderId: UserId;
}
export interface UserProfile {
    bio: string;
    username: string;
    displayName: string;
    profilePhoto?: ExternalBlob;
}
export enum MediaType {
    video = "video",
    photo = "photo"
}
export enum NotificationType {
    like = "like",
    comment = "comment",
    follow = "follow"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createComment(postId: PostId, text: string): Promise<Comment>;
    createPost(media: ExternalBlob, mediaType: MediaType, caption: string): Promise<Post>;
    followUser(followeeId: UserId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherUserId: UserId): Promise<Array<Message>>;
    getExploreFeed(page: bigint, pageSize: bigint): Promise<Array<Post>>;
    getFollowers(userId: UserId): Promise<Array<UserId>>;
    getFollowing(userId: UserId): Promise<Array<UserId>>;
    getHomeFeed(page: bigint, pageSize: bigint): Promise<Array<Post>>;
    getNotifications(): Promise<Array<Notification>>;
    getPost(postId: PostId): Promise<Post | null>;
    getPostComments(postId: PostId): Promise<Array<Comment>>;
    getPostLikes(postId: PostId): Promise<Array<UserId>>;
    getRecentConversations(): Promise<Array<UserId>>;
    getUserPosts(userId: UserId): Promise<Array<Post>>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationsAsRead(notificationIds: Array<NotificationId>): Promise<void>;
    registerUser(username: string, displayName: string): Promise<UserProfile>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchUsers(prefix: string): Promise<Array<UserProfile>>;
    sendMessage(receiverId: UserId, text: string): Promise<Message>;
    toggleLike(postId: PostId): Promise<boolean>;
    unfollowUser(followeeId: UserId): Promise<void>;
    updateProfile(displayName: string, bio: string, profilePhoto: ExternalBlob | null): Promise<UserProfile>;
}
