import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type WithdrawalMethod = {
    __kind__: "upi";
    upi: string;
} | {
    __kind__: "bankTransfer";
    bankTransfer: {
        ifsc: string;
        accountNumber: string;
    };
};
export interface Comment {
    authorId: UserId;
    createdAt: bigint;
    text: string;
    postId: PostId;
}
export interface AdminPostInfo {
    id: PostId;
    likeCount: bigint;
    authorId: UserId;
    createdAt: bigint;
    caption: string;
    commentCount: bigint;
    mediaType: MediaType;
    isFlagged: boolean;
    flagCount: bigint;
}
export type TxId = bigint;
export type PostId = bigint;
export interface WalletTransaction {
    id: TxId;
    status: WalletTxStatus;
    userId: UserId;
    description: string;
    timestamp: bigint;
    withdrawalMethod?: WithdrawalMethod;
    txType: WalletTxType;
    amount: number;
}
export interface ReferralStats {
    referralCode: string;
    totalReferrals: bigint;
    totalEarned: number;
}
export interface AdminAnalytics {
    pendingWithdrawals: bigint;
    totalUsers: bigint;
    totalWithdrawals: number;
    totalPosts: bigint;
    newUsersThisWeek: bigint;
    totalReels: bigint;
}
export type UserId = Principal;
export interface AdminReferralStats {
    totalReferrals: bigint;
    totalPaid: number;
    topReferrers: Array<{
        username: string;
        earnings: number;
    }>;
    pendingPayout: number;
}
export type MessageId = bigint;
export interface Post {
    id: PostId;
    authorId: UserId;
    createdAt: bigint;
    tags: Array<string>;
    mediaUrl: string;
    caption: string;
    mediaType: MediaType;
    location?: string;
}
export type NotificationId = bigint;
export interface WalletInfo {
    balance: number;
    transactions: Array<WalletTransaction>;
}
export interface Notification {
    id: NotificationId;
    createdAt: bigint;
    read: boolean;
    type: NotificationType;
    actorId: UserId;
    message?: string;
    recipientId: UserId;
    postId?: PostId;
}
export interface Message {
    id: MessageId;
    createdAt: bigint;
    text: string;
    receiverId: UserId;
    senderId: UserId;
}
export interface WithdrawalRequest {
    id: TxId;
    status: WithdrawalStatus;
    method: string;
    userId: UserId;
    createdAt: bigint;
    rejectionReason?: string;
    amount: number;
    accountDetails: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    displayName: string;
    socialLinks: Array<string>;
    profilePhoto?: string;
    pronouns?: string;
}
export interface AdminUserInfo {
    postCount: bigint;
    username: string;
    displayName: string;
    userId: UserId;
    joinedAt: bigint;
    isActive: boolean;
    isSuspended: boolean;
    followerCount: bigint;
}
export enum MediaType {
    video = "video",
    photo = "photo"
}
export enum NotificationType {
    referralReel = "referralReel",
    like = "like",
    comment = "comment",
    referralFollowers = "referralFollowers",
    referralSignup = "referralSignup",
    follow = "follow"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WalletTxStatus {
    pending = "pending",
    completed = "completed",
    approved = "approved",
    rejected = "rejected"
}
export enum WalletTxType {
    referralReel = "referralReel",
    withdrawal = "withdrawal",
    referralFollowers = "referralFollowers",
    referralSignup = "referralSignup"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    adminApproveWithdrawal(txId: TxId): Promise<void>;
    adminGetAnalytics(): Promise<AdminAnalytics>;
    adminGetFlaggedPosts(): Promise<Array<AdminPostInfo>>;
    adminGetPosts(page: bigint, pageSize: bigint): Promise<Array<AdminPostInfo>>;
    adminGetReferralStats(): Promise<AdminReferralStats>;
    adminGetUsers(page: bigint, pageSize: bigint): Promise<Array<AdminUserInfo>>;
    adminGetWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    adminRejectWithdrawal(txId: TxId, reason: string): Promise<void>;
    adminRemovePost(postId: PostId): Promise<void>;
    adminSearchUsers(searchQuery: string): Promise<Array<AdminUserInfo>>;
    adminSetAdmin(userId: Principal): Promise<void>;
    adminSuspendUser(userId: Principal): Promise<void>;
    adminUnsuspendUser(userId: Principal): Promise<void>;
    approveWithdrawal(txId: TxId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createComment(postId: PostId, text: string): Promise<Comment>;
    createPost(mediaUrl: string, mediaType: MediaType, caption: string, location: string | null, tags: Array<string>): Promise<Post>;
    flagPost(postId: PostId): Promise<void>;
    followUser(followeeId: UserId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherUserId: UserId): Promise<Array<Message>>;
    getExploreFeed(page: bigint, pageSize: bigint): Promise<Array<Post>>;
    getFollowers(userId: UserId): Promise<Array<UserId>>;
    getFollowing(userId: UserId): Promise<Array<UserId>>;
    getHomeFeed(page: bigint, pageSize: bigint): Promise<Array<Post>>;
    getMyWallet(): Promise<WalletInfo>;
    getNotifications(): Promise<Array<Notification>>;
    getPost(postId: PostId): Promise<Post | null>;
    getPostComments(postId: PostId): Promise<Array<Comment>>;
    getPostLikes(postId: PostId): Promise<Array<UserId>>;
    getRecentConversations(): Promise<Array<UserId>>;
    getReferralStats(): Promise<ReferralStats>;
    getUserPosts(userId: UserId): Promise<Array<Post>>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    getWithdrawalRequests(): Promise<Array<WalletTransaction>>;
    isAdmin(userId: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationsAsRead(notificationIds: Array<NotificationId>): Promise<void>;
    registerUser(username: string, displayName: string, referralCode: string | null): Promise<UserProfile>;
    rejectWithdrawal(txId: TxId): Promise<void>;
    requestWithdrawal(amount: number, method: WithdrawalMethod): Promise<{
        __kind__: "ok";
        ok: WalletTransaction;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchUsers(prefix: string): Promise<Array<UserProfile>>;
    sendMessage(receiverId: UserId, text: string): Promise<Message>;
    toggleLike(postId: PostId): Promise<boolean>;
    unfollowUser(followeeId: UserId): Promise<void>;
    updateProfile(displayName: string, bio: string, profilePhoto: string | null, pronouns: string | null, socialLinks: Array<string>): Promise<UserProfile>;
}
