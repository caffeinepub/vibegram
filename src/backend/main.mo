import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import List "mo:core/List";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Float "mo:core/Float";
import Char "mo:core/Char";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // ── Authorization ────────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── ID types ─────────────────────────────────────────────────────────────────
  type UserId = Principal;
  type PostId = Nat;
  type NotificationId = Nat;
  type MessageId = Nat;
  type TxId = Nat;

  // ── Core types ────────────────────────────────────────────────────────────────

  public type MediaType = {
    #photo;
    #video;
  };

  module MediaType {
    public func compare(a : MediaType, b : MediaType) : Order.Order {
      switch (a, b) {
        case (#photo, #video) { #less };
        case (#video, #photo) { #greater };
        case (_, _) { #equal };
      };
    };
  };

  public type UserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePhoto : ?Text;
    pronouns : ?Text;
    socialLinks : [Text];
  };

  public type Post = {
    id : PostId;
    authorId : UserId;
    mediaUrl : Text;
    mediaType : MediaType;
    caption : Text;
    location : ?Text;
    tags : [Text];
    createdAt : Int;
  };

  module Post {
    public func compareNewest(a : Post, b : Post) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  public type Comment = {
    postId : PostId;
    authorId : UserId;
    text : Text;
    createdAt : Int;
  };

  public type NotificationType = {
    #like;
    #comment;
    #follow;
    #referralSignup;
    #referralReel;
    #referralFollowers;
  };

  public type Notification = {
    id : NotificationId;
    recipientId : UserId;
    type_ : NotificationType;
    actorId : UserId;
    postId : ?PostId;
    message : ?Text;
    createdAt : Int;
    read : Bool;
  };

  module Notification {
    public func compareNewest(a : Notification, b : Notification) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  public type Message = {
    id : MessageId;
    senderId : UserId;
    receiverId : UserId;
    text : Text;
    createdAt : Int;
  };

  module Message {
    public func compareOldest(a : Message, b : Message) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    };
  };

  // ── Wallet types ──────────────────────────────────────────────────────────────

  public type WalletTxType = {
    #referralSignup;
    #referralReel;
    #referralFollowers;
    #withdrawal;
  };

  public type WalletTxStatus = {
    #completed;
    #pending;
    #approved;
    #rejected;
  };

  public type WithdrawalMethod = {
    #upi : Text;
    #bankTransfer : { accountNumber : Text; ifsc : Text };
  };

  public type WalletTransaction = {
    id : TxId;
    userId : UserId;
    amount : Float;
    txType : WalletTxType;
    description : Text;
    status : WalletTxStatus;
    withdrawalMethod : ?WithdrawalMethod;
    timestamp : Int;
  };

  public type WalletInfo = {
    balance : Float;
    transactions : [WalletTransaction];
  };

  public type ReferralRecord = {
    referrerId : UserId;
    referredId : UserId;
    signupBonusPaid : Bool;
    reelBonusPaid : Bool;
    followerBonusPaid : Bool;
    createdAt : Int;
  };

  public type ReferralStats = {
    referralCode : Text;
    totalReferrals : Nat;
    totalEarned : Float;
  };

  // ── Admin types ───────────────────────────────────────────────────────────────

  public type WithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type WithdrawalRequest = {
    id : TxId;
    userId : UserId;
    amount : Float;
    method : Text;
    accountDetails : Text;
    status : WithdrawalStatus;
    rejectionReason : ?Text;
    createdAt : Int;
  };

  public type AdminUserInfo = {
    userId : UserId;
    username : Text;
    displayName : Text;
    postCount : Nat;
    followerCount : Nat;
    isActive : Bool;
    isSuspended : Bool;
    joinedAt : Int;
  };

  public type AdminPostInfo = {
    id : PostId;
    authorId : UserId;
    caption : Text;
    mediaType : MediaType;
    createdAt : Int;
    likeCount : Nat;
    commentCount : Nat;
    isFlagged : Bool;
    flagCount : Nat;
  };

  public type AdminReferralStats = {
    totalReferrals : Nat;
    totalPaid : Float;
    pendingPayout : Float;
    topReferrers : [{ username : Text; earnings : Float }];
  };

  public type AdminAnalytics = {
    totalUsers : Nat;
    newUsersThisWeek : Nat;
    totalPosts : Nat;
    totalReels : Nat;
    totalWithdrawals : Float;
    pendingWithdrawals : Nat;
  };

  // ── State ─────────────────────────────────────────────────────────────────────

  let users = Map.empty<UserId, UserProfile>();
  var nextPostId = 0;
  let posts = Map.empty<PostId, Post>();
  let likes = Map.empty<PostId, List.List<UserId>>();
  let comments = Map.empty<PostId, List.List<Comment>>();
  // follows: followeeId -> List<followerId>
  let follows = Map.empty<UserId, List.List<UserId>>();
  var nextNotificationId = 0;
  let notifications = Map.empty<NotificationId, Notification>();
  var nextMessageId = 0;
  let messages = Map.empty<MessageId, Message>();
  let userJoinTimes = Map.empty<UserId, Int>();

  // Admin state
  let admins = Set.empty<UserId>();
  let suspendedUsers = Set.empty<UserId>();
  let flaggedPosts = Set.empty<PostId>();
  let flagCounts = Map.empty<PostId, Nat>();
  var nextTxId = 0;
  let withdrawalRequests = Map.empty<TxId, WithdrawalRequest>();

  // Wallet & referral state
  let walletBalances = Map.empty<UserId, Float>();
  let walletTransactions = Map.empty<TxId, WalletTransaction>();
  // referrals: referredId -> ReferralRecord
  let referrals = Map.empty<UserId, ReferralRecord>();

  // ── Referral code helpers ─────────────────────────────────────────────────────

  // Referral code = first 8 chars of username uppercased + 4-digit stable suffix
  func generateReferralCode(username : Text) : Text {
    let upper = username.toUpper();
    let chars = upper.toArray();
    let prefixLen = Nat.min(8, chars.size());
    var prefix = "";
    var i = 0;
    while (i < prefixLen) {
      prefix := prefix # Text.fromChar(chars[i]);
      i += 1;
    };
    // 4-digit suffix from sum of char codes
    var sum : Nat = 0;
    chars.forEach(func(c) {
      sum := sum + c.toNat32().toNat();
    });
    let suffix = sum % 10000;
    let s = suffix.toText();
    let pad = if (s.size() < 4) {
      var p = "";
      var j = 0;
      while (j < (4 - s.size())) { p := p # "0"; j += 1 };
      p # s;
    } else { s };
    prefix # pad;
  };

  func findUserByReferralCode(code : Text) : ?UserId {
    let result = users.entries().toArray().find(func((uid, profile)) {
      generateReferralCode(profile.username) == code
    });
    switch (result) {
      case (?entry) ?entry.0;
      case null null;
    };
  };

  // ── Wallet helpers ────────────────────────────────────────────────────────────

  func getBalance(userId : UserId) : Float {
    switch (walletBalances.get(userId)) {
      case (?b) b;
      case null 0.0;
    };
  };

  func creditWallet(userId : UserId, amount : Float, txType : WalletTxType, description : Text) {
    walletBalances.add(userId, getBalance(userId) + amount);
    let tx : WalletTransaction = {
      id = nextTxId;
      userId;
      amount;
      txType;
      description;
      status = #completed;
      withdrawalMethod = null;
      timestamp = Time.now();
    };
    walletTransactions.add(nextTxId, tx);
    nextTxId += 1;
  };

  // ── Notification helper ───────────────────────────────────────────────────────

  func addNotification(
    recipientId : UserId,
    type_ : NotificationType,
    actorId : UserId,
    postId : ?PostId,
    message : ?Text,
  ) {
    notifications.add(
      nextNotificationId,
      {
        id = nextNotificationId;
        recipientId;
        type_;
        actorId;
        postId;
        message;
        createdAt = Time.now();
        read = false;
      },
    );
    nextNotificationId += 1;
  };

  // ── Follow helpers ────────────────────────────────────────────────────────────

  func getFollowerCount(userId : UserId) : Nat {
    switch (follows.get(userId)) {
      case (null) 0;
      case (?f) f.size();
    };
  };

  func checkFollowerMilestone(userId : UserId) {
    if (getFollowerCount(userId) >= 100) {
      switch (referrals.get(userId)) {
        case (null) {};
        case (?ref) {
          if (not ref.followerBonusPaid) {
            creditWallet(ref.referrerId, 50.0, #referralFollowers, "Referral reached 100 followers");
            addNotification(ref.referrerId, #referralFollowers, userId, null, ?"Your referral hit 100 followers! You earned ₹50!");
            referrals.add(userId, { ref with followerBonusPaid = true });
          };
        };
      };
    };
  };

  func addFollower(followerId : UserId, followeeId : UserId) {
    let current = switch (follows.get(followeeId)) {
      case (null) List.empty<UserId>();
      case (?f) f;
    };
    if (current.any(func(id) { Principal.equal(id, followerId) })) { return };
    current.add(followerId);
    follows.add(followeeId, current);
  };

  func removeFollower(followerId : UserId, followeeId : UserId) {
    switch (follows.get(followeeId)) {
      case (null) {};
      case (?current) {
        follows.add(followeeId, current.filter(func(id) { not Principal.equal(id, followerId) }));
      };
    };
  };

  // ── Like helpers ──────────────────────────────────────────────────────────────

  func addLike(postId : PostId, userId : UserId) {
    let current = switch (likes.get(postId)) {
      case (null) List.empty<UserId>();
      case (?l) l;
    };
    if (current.any(func(id) { Principal.equal(id, userId) })) { return };
    current.add(userId);
    likes.add(postId, current);
  };

  func removeLike(postId : PostId, userId : UserId) {
    switch (likes.get(postId)) {
      case (null) {};
      case (?current) {
        likes.add(postId, current.filter(func(id) { not Principal.equal(id, userId) }));
      };
    };
  };

  // ── Admin helpers ─────────────────────────────────────────────────────────────

  func isAdminPrincipal(p : Principal) : Bool {
    if (admins.contains(p)) { return true };
    switch (users.get(p)) {
      case (?profile) { profile.username == "admin" };
      case null false;
    };
  };

  func requireAdmin(caller : Principal) {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
  };

  func getPostCount(userId : UserId) : Nat {
    posts.values().toArray().filter(func(p) { Principal.equal(p.authorId, userId) }).size();
  };

  func buildAdminUserInfo(userId : UserId, profile : UserProfile) : AdminUserInfo {
    {
      userId;
      username = profile.username;
      displayName = profile.displayName;
      postCount = getPostCount(userId);
      followerCount = getFollowerCount(userId);
      isActive = true;
      isSuspended = suspendedUsers.contains(userId);
      joinedAt = switch (userJoinTimes.get(userId)) {
        case (?t) t;
        case null 0;
      };
    };
  };

  func buildAdminPostInfo(post : Post) : AdminPostInfo {
    {
      id = post.id;
      authorId = post.authorId;
      caption = post.caption;
      mediaType = post.mediaType;
      createdAt = post.createdAt;
      likeCount = switch (likes.get(post.id)) {
        case (null) 0;
        case (?l) l.size();
      };
      commentCount = switch (comments.get(post.id)) {
        case (null) 0;
        case (?c) c.size();
      };
      isFlagged = flaggedPosts.contains(post.id);
      flagCount = switch (flagCounts.get(post.id)) {
        case (null) 0;
        case (?n) n;
      };
    };
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Profile management ────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public query func getUserProfile(userId : UserId) : async ?UserProfile {
    users.get(userId);
  };

  // Register user — optional referral code triggers ₹10 bonus to referrer
  public shared ({ caller }) func registerUser(
    username : Text,
    displayName : Text,
    referralCode : ?Text,
  ) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can register");
    };
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered");
    };
    let profile : UserProfile = {
      username;
      displayName;
      bio = "";
      profilePhoto = null;
      pronouns = null;
      socialLinks = [];
    };
    users.add(caller, profile);
    userJoinTimes.add(caller, Time.now());
    // First registered user becomes superadmin
    if (users.size() == 1) {
      admins.add(caller);
    };

    // Process referral
    switch (referralCode) {
      case (null) {};
      case (?code) {
        switch (findUserByReferralCode(code)) {
          case (null) {}; // invalid code — silently ignore
          case (?referrerId) {
            if (not Principal.equal(referrerId, caller)) {
              referrals.add(
                caller,
                {
                  referrerId;
                  referredId = caller;
                  signupBonusPaid = true;
                  reelBonusPaid = false;
                  followerBonusPaid = false;
                  createdAt = Time.now();
                },
              );
              creditWallet(referrerId, 10.0, #referralSignup, "Referral signup bonus");
              addNotification(referrerId, #referralSignup, caller, null, ?"Your referral signed up! You earned \u{20B9}10!");
            };
          };
        };
      };
    };

    profile;
  };

  public shared ({ caller }) func updateProfile(
    displayName : Text,
    bio : Text,
    profilePhoto : ?Text,
    pronouns : ?Text,
    socialLinks : [Text],
  ) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updated : UserProfile = {
          profile with
          displayName;
          bio;
          profilePhoto;
          pronouns;
          socialLinks;
        };
        users.add(caller, updated);
        updated;
      };
    };
  };

  // ── Posts ─────────────────────────────────────────────────────────────────────

  // Create post — triggers ₹20 reel bonus to referrer on first video
  public shared ({ caller }) func createPost(
    mediaUrl : Text,
    mediaType : MediaType,
    caption : Text,
    location : ?Text,
    tags : [Text],
  ) : async Post {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    let post : Post = {
      id = nextPostId;
      authorId = caller;
      mediaUrl;
      mediaType;
      caption;
      location;
      tags;
      createdAt = Time.now();
    };
    posts.add(nextPostId, post);
    nextPostId += 1;

    // Reel bonus: first video post by this user
    switch (mediaType) {
      case (#video) {
        switch (referrals.get(caller)) {
          case (null) {};
          case (?ref) {
            if (not ref.reelBonusPaid) {
              let userVideos = posts.values().toArray().filter(func(p) {
                Principal.equal(p.authorId, caller) and p.mediaType == #video
              });
              if (userVideos.size() == 1) {
                creditWallet(ref.referrerId, 20.0, #referralReel, "Referral first reel bonus");
                addNotification(ref.referrerId, #referralReel, caller, null, ?"Your referral posted their first reel! You earned \u{20B9}20!");
                referrals.add(caller, { ref with reelBonusPaid = true });
              };
            };
          };
        };
      };
      case (#photo) {};
    };

    post;
  };

  public query func getPost(postId : PostId) : async ?Post {
    posts.get(postId);
  };

  public query ({ caller }) func getHomeFeed(page : Nat, pageSize : Nat) : async [Post] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view home feed");
    };
    let followedUsers = switch (follows.get(caller)) {
      case (null) List.empty<UserId>();
      case (?f) f;
    };
    let feedPosts = posts.values().toArray().filter(func(post) {
      followedUsers.any(func(uid) { Principal.equal(uid, post.authorId) });
    });
    let sorted = feedPosts.sort(Post.compareNewest);
    let start = page * pageSize;
    if (start >= sorted.size()) { [] } else {
      sorted.sliceToArray(start, Nat.min(start + pageSize, sorted.size()));
    };
  };

  public query func getExploreFeed(page : Nat, pageSize : Nat) : async [Post] {
    let sorted = posts.values().toArray().sort(Post.compareNewest);
    let start = page * pageSize;
    if (start >= sorted.size()) { [] } else {
      sorted.sliceToArray(start, Nat.min(start + pageSize, sorted.size()));
    };
  };

  public query func getUserPosts(userId : UserId) : async [Post] {
    posts.values().toArray().filter(func(p) { Principal.equal(p.authorId, userId) }).sort(Post.compareNewest);
  };

  // ── Likes ─────────────────────────────────────────────────────────────────────

  public shared ({ caller }) func toggleLike(postId : PostId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let current = switch (likes.get(postId)) {
          case (null) List.empty<UserId>();
          case (?l) l;
        };
        if (current.any(func(id) { Principal.equal(id, caller) })) {
          removeLike(postId, caller);
          false;
        } else {
          addLike(postId, caller);
          if (not Principal.equal(post.authorId, caller)) {
            addNotification(post.authorId, #like, caller, ?postId, null);
          };
          true;
        };
      };
    };
  };

  public query func getPostLikes(postId : PostId) : async [UserId] {
    switch (likes.get(postId)) {
      case (null) [];
      case (?l) l.toArray();
    };
  };

  // ── Comments ──────────────────────────────────────────────────────────────────

  public shared ({ caller }) func createComment(postId : PostId, text : Text) : async Comment {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let comment : Comment = {
          postId;
          authorId = caller;
          text;
          createdAt = Time.now();
        };
        let current = switch (comments.get(postId)) {
          case (null) List.empty<Comment>();
          case (?c) c;
        };
        current.add(comment);
        comments.add(postId, current);
        if (not Principal.equal(post.authorId, caller)) {
          addNotification(post.authorId, #comment, caller, ?postId, null);
        };
        comment;
      };
    };
  };

  public query func getPostComments(postId : PostId) : async [Comment] {
    switch (comments.get(postId)) {
      case (null) [];
      case (?c) c.toArray();
    };
  };

  // ── Follow system ─────────────────────────────────────────────────────────────

  // Follow user — triggers ₹50 milestone bonus when followee hits 100 followers
  public shared ({ caller }) func followUser(followeeId : UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    if (not users.containsKey(followeeId)) {
      Runtime.trap("User does not exist");
    };
    if (Principal.equal(caller, followeeId)) {
      Runtime.trap("Cannot follow yourself");
    };
    addFollower(caller, followeeId);
    addNotification(followeeId, #follow, caller, null, null);
    checkFollowerMilestone(followeeId);
  };

  public shared ({ caller }) func unfollowUser(followeeId : UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    if (not users.containsKey(followeeId)) {
      Runtime.trap("User does not exist");
    };
    removeFollower(caller, followeeId);
  };

  public query func getFollowers(userId : UserId) : async [UserId] {
    switch (follows.get(userId)) {
      case (null) [];
      case (?f) f.toArray();
    };
  };

  public query func getFollowing(userId : UserId) : async [UserId] {
    follows.entries().toArray().filter(func((followeeId, followers)) {
      followers.any(func(followerId) { Principal.equal(followerId, userId) });
    }).map(func((followeeId, _)) { followeeId });
  };

  // ── Notifications ─────────────────────────────────────────────────────────────

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    notifications.values().toArray().filter(func(n) {
      Principal.equal(n.recipientId, caller);
    }).sort(Notification.compareNewest);
  };

  public shared ({ caller }) func markNotificationsAsRead(notificationIds : [NotificationId]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    notificationIds.forEach(func(id) {
      switch (notifications.get(id)) {
        case (null) {};
        case (?n) {
          if (not Principal.equal(n.recipientId, caller)) {
            Runtime.trap("Unauthorized: Can only mark your own notifications as read");
          };
          notifications.add(id, { n with read = true });
        };
      };
    });
  };

  // ── Messaging ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func sendMessage(receiverId : UserId, text : Text) : async Message {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (not users.containsKey(caller)) {
      Runtime.trap("User not registered");
    };
    if (not users.containsKey(receiverId)) {
      Runtime.trap("User does not exist");
    };
    let message : Message = {
      id = nextMessageId;
      senderId = caller;
      receiverId;
      text;
      createdAt = Time.now();
    };
    messages.add(nextMessageId, message);
    nextMessageId += 1;
    message;
  };

  public query ({ caller }) func getConversation(otherUserId : UserId) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    messages.values().toArray().filter(func(m) {
      (Principal.equal(m.senderId, caller) and Principal.equal(m.receiverId, otherUserId)) or
      (Principal.equal(m.senderId, otherUserId) and Principal.equal(m.receiverId, caller));
    }).sort(Message.compareOldest);
  };

  public query ({ caller }) func getRecentConversations() : async [UserId] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    let userMessages = messages.values().toArray().filter(func(m) {
      Principal.equal(m.senderId, caller) or Principal.equal(m.receiverId, caller);
    });
    let conversationPartners = Map.empty<UserId, Int>();
    userMessages.forEach(func(m) {
      let partnerId = if (Principal.equal(m.senderId, caller)) { m.receiverId } else { m.senderId };
      switch (conversationPartners.get(partnerId)) {
        case (null) { conversationPartners.add(partnerId, m.createdAt) };
        case (?lastTime) {
          if (m.createdAt > lastTime) { conversationPartners.add(partnerId, m.createdAt) };
        };
      };
    });
    conversationPartners.entries().toArray().sort(func((_, tA), (_, tB)) {
      Int.compare(tB, tA);
    }).map(func((uid, _)) { uid });
  };

  // ── Search ────────────────────────────────────────────────────────────────────

  public query func searchUsers(prefix : Text) : async [UserProfile] {
    let lower = prefix.toLower();
    users.values().toArray().filter(func(profile) {
      profile.username.toLower().startsWith(#text lower);
    });
  };

  // ── Moderation ────────────────────────────────────────────────────────────────

  public shared ({ caller }) func flagPost(postId : PostId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can flag posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (_) {
        flaggedPosts.add(postId);
        let n = switch (flagCounts.get(postId)) {
          case (null) 0;
          case (?c) c;
        };
        flagCounts.add(postId, n + 1);
      };
    };
  };

  // ── Wallet API ────────────────────────────────────────────────────────────────

  public query ({ caller }) func getMyWallet() : async WalletInfo {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their wallet");
    };
    let balance = getBalance(caller);
    let txs = walletTransactions.values().toArray().filter(func(tx) {
      Principal.equal(tx.userId, caller);
    });
    { balance; transactions = txs };
  };

  public shared ({ caller }) func requestWithdrawal(
    amount : Float,
    method : WithdrawalMethod,
  ) : async { #ok : WalletTransaction; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };
    if (amount < 100.0) {
      return #err("Minimum withdrawal amount is \u{20B9}100");
    };
    let balance = getBalance(caller);
    if (balance < amount) {
      return #err("Insufficient balance. Available: \u{20B9}" # balance.toText());
    };
    // Debit balance (held pending approval)
    walletBalances.add(caller, balance - amount);
    let methodStr = switch (method) {
      case (#upi upi) { "UPI: " # upi };
      case (#bankTransfer { accountNumber; ifsc }) { "Bank: " # accountNumber # " IFSC: " # ifsc };
    };
    let tx : WalletTransaction = {
      id = nextTxId;
      userId = caller;
      amount;
      txType = #withdrawal;
      description = "Withdrawal request via " # methodStr;
      status = #pending;
      withdrawalMethod = ?method;
      timestamp = Time.now();
    };
    walletTransactions.add(nextTxId, tx);
    // Also record in withdrawal requests for admin
    let req : WithdrawalRequest = {
      id = nextTxId;
      userId = caller;
      amount;
      method = switch (method) {
        case (#upi _) "UPI";
        case (#bankTransfer _) "Bank Transfer";
      };
      accountDetails = methodStr;
      status = #pending;
      rejectionReason = null;
      createdAt = Time.now();
    };
    withdrawalRequests.add(nextTxId, req);
    nextTxId += 1;
    #ok(tx);
  };

  public query ({ caller }) func getWithdrawalRequests() : async [WalletTransaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal requests");
    };
    walletTransactions.values().toArray().filter(func(tx) {
      tx.txType == #withdrawal and tx.status == #pending;
    });
  };

  public shared ({ caller }) func approveWithdrawal(txId : TxId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };
    switch (walletTransactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.txType != #withdrawal) { Runtime.trap("Not a withdrawal transaction") };
        if (tx.status != #pending) { Runtime.trap("Transaction is not pending") };
        walletTransactions.add(txId, { tx with status = #approved });
        switch (withdrawalRequests.get(txId)) {
          case (?req) { withdrawalRequests.add(txId, { req with status = #approved }) };
          case null {};
        };
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawal(txId : TxId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };
    switch (walletTransactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.txType != #withdrawal) { Runtime.trap("Not a withdrawal transaction") };
        if (tx.status != #pending) { Runtime.trap("Transaction is not pending") };
        // Refund balance
        walletBalances.add(tx.userId, getBalance(tx.userId) + tx.amount);
        walletTransactions.add(txId, { tx with status = #rejected });
        switch (withdrawalRequests.get(txId)) {
          case (?req) { withdrawalRequests.add(txId, { req with status = #rejected }) };
          case null {};
        };
      };
    };
  };

  // ── Referral API ──────────────────────────────────────────────────────────────

  public query ({ caller }) func getReferralStats() : async ReferralStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view referral stats");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let referralCode = generateReferralCode(profile.username);
        let myReferrals = referrals.values().toArray().filter(func(ref) {
          Principal.equal(ref.referrerId, caller);
        });
        var totalEarned = 0.0;
        myReferrals.forEach(func(ref) {
          if (ref.signupBonusPaid) { totalEarned := totalEarned + 10.0 };
          if (ref.reelBonusPaid) { totalEarned := totalEarned + 20.0 };
          if (ref.followerBonusPaid) { totalEarned := totalEarned + 50.0 };
        });
        { referralCode; totalReferrals = myReferrals.size(); totalEarned };
      };
    };
  };

  // ── Admin API ─────────────────────────────────────────────────────────────────

  public query func isAdmin(userId : Principal) : async Bool {
    isAdminPrincipal(userId);
  };

  public shared ({ caller }) func adminSetAdmin(userId : Principal) : async () {
    requireAdmin(caller);
    admins.add(userId);
  };

  public query ({ caller }) func adminGetUsers(page : Nat, pageSize : Nat) : async [AdminUserInfo] {
    requireAdmin(caller);
    let allUsers = users.entries().toArray();
    let start = page * pageSize;
    if (start >= allUsers.size()) { return [] };
    allUsers.sliceToArray(start, Nat.min(start + pageSize, allUsers.size())).map(func((uid, profile)) {
      buildAdminUserInfo(uid, profile);
    });
  };

  public query ({ caller }) func adminSearchUsers(searchQuery : Text) : async [AdminUserInfo] {
    requireAdmin(caller);
    let q = searchQuery.toLower();
    users.entries().toArray().filter(func((_, p)) {
      p.username.toLower().contains(#text q) or p.displayName.toLower().contains(#text q);
    }).map(func((uid, p)) { buildAdminUserInfo(uid, p) });
  };

  public shared ({ caller }) func adminSuspendUser(userId : Principal) : async () {
    requireAdmin(caller);
    if (not users.containsKey(userId)) { Runtime.trap("User does not exist") };
    suspendedUsers.add(userId);
  };

  public shared ({ caller }) func adminUnsuspendUser(userId : Principal) : async () {
    requireAdmin(caller);
    suspendedUsers.remove(userId);
  };

  public query ({ caller }) func adminGetPosts(page : Nat, pageSize : Nat) : async [AdminPostInfo] {
    requireAdmin(caller);
    let allPosts = posts.values().toArray().sort(Post.compareNewest);
    let start = page * pageSize;
    if (start >= allPosts.size()) { return [] };
    allPosts.sliceToArray(start, Nat.min(start + pageSize, allPosts.size())).map(buildAdminPostInfo);
  };

  public shared ({ caller }) func adminRemovePost(postId : PostId) : async () {
    requireAdmin(caller);
    if (not posts.containsKey(postId)) { Runtime.trap("Post does not exist") };
    posts.remove(postId);
    likes.remove(postId);
    comments.remove(postId);
    flaggedPosts.remove(postId);
    flagCounts.remove(postId);
  };

  public query ({ caller }) func adminGetFlaggedPosts() : async [AdminPostInfo] {
    requireAdmin(caller);
    flaggedPosts.values().toArray().filterMap(func(postId) : ?AdminPostInfo {
      switch (posts.get(postId)) {
        case (?post) ?buildAdminPostInfo(post);
        case null null;
      };
    });
  };

  public query ({ caller }) func adminGetReferralStats() : async AdminReferralStats {
    requireAdmin(caller);
    let allReferrals = referrals.values().toArray();
    var totalPaid = 0.0;
    let earningsMap = Map.empty<UserId, Float>();
    allReferrals.forEach(func(ref) {
      var earned = 0.0;
      if (ref.signupBonusPaid) { earned := earned + 10.0 };
      if (ref.reelBonusPaid) { earned := earned + 20.0 };
      if (ref.followerBonusPaid) { earned := earned + 50.0 };
      totalPaid := totalPaid + earned;
      let current = switch (earningsMap.get(ref.referrerId)) {
        case (null) 0.0;
        case (?e) e;
      };
      earningsMap.add(ref.referrerId, current + earned);
    });
    let pendingPayout = walletTransactions.values().toArray()
      .filter(func(tx) { tx.txType == #withdrawal and tx.status == #pending })
      .foldLeft(0.0, func(acc, tx) { acc + tx.amount });
    let sorted = earningsMap.entries().toArray().sort(func((_, a), (_, b)) {
      if (a > b) #less else if (a < b) #greater else #equal;
    });
    let top = sorted.sliceToArray(0, Nat.min(10, sorted.size()));
    let topReferrers = top.map(func((uid, earnings)) {
      let username = switch (users.get(uid)) {
        case (?p) p.username;
        case null uid.toText();
      };
      { username; earnings };
    });
    { totalReferrals = allReferrals.size(); totalPaid; pendingPayout; topReferrers };
  };

  public query ({ caller }) func adminGetAnalytics() : async AdminAnalytics {
    requireAdmin(caller);
    let now = Time.now();
    let oneWeekNs : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
    let weekAgo = now - oneWeekNs;
    let allPostsArr = posts.values().toArray();
    let approvedWithdrawals = walletTransactions.values().toArray()
      .filter(func(tx) { tx.txType == #withdrawal and tx.status == #approved });
    {
      totalUsers = users.size();
      newUsersThisWeek = userJoinTimes.values().toArray().filter(func(t) { t > weekAgo }).size();
      totalPosts = allPostsArr.filter(func(p) { p.mediaType == #photo }).size();
      totalReels = allPostsArr.filter(func(p) { p.mediaType == #video }).size();
      totalWithdrawals = approvedWithdrawals.foldLeft(0.0, func(acc, tx) { acc + tx.amount });
      pendingWithdrawals = walletTransactions.values().toArray()
        .filter(func(tx) { tx.txType == #withdrawal and tx.status == #pending }).size();
    };
  };

  public query ({ caller }) func adminGetWithdrawalRequests() : async [WithdrawalRequest] {
    requireAdmin(caller);
    withdrawalRequests.values().toArray().filter(func(req) { req.status == #pending });
  };

  public shared ({ caller }) func adminApproveWithdrawal(txId : TxId) : async () {
    requireAdmin(caller);
    switch (withdrawalRequests.get(txId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?req) {
        if (req.status != #pending) { Runtime.trap("Withdrawal is not pending") };
        withdrawalRequests.add(txId, { req with status = #approved });
      };
    };
  };

  public shared ({ caller }) func adminRejectWithdrawal(txId : TxId, reason : Text) : async () {
    requireAdmin(caller);
    switch (withdrawalRequests.get(txId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?req) {
        if (req.status != #pending) { Runtime.trap("Withdrawal is not pending") };
        withdrawalRequests.add(txId, { req with status = #rejected; rejectionReason = ?reason });
        // Refund balance
        walletBalances.add(req.userId, getBalance(req.userId) + req.amount);
      };
    };
  };
};
