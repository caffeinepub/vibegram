import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  type UserId = Principal;
  type PostId = Nat;
  type NotificationId = Nat;
  type MessageId = Nat;

  public type UserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  public type Post = {
    id : PostId;
    authorId : UserId;
    media : Storage.ExternalBlob;
    mediaType : MediaType;
    caption : Text;
    createdAt : Time.Time;
  };

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

  public type Comment = {
    postId : PostId;
    authorId : UserId;
    text : Text;
    createdAt : Time.Time;
  };

  public type Notification = {
    id : NotificationId;
    recipientId : UserId;
    type_ : NotificationType;
    actorId : UserId;
    postId : ?PostId;
    createdAt : Time.Time;
    read : Bool;
  };

  public type NotificationType = {
    #like;
    #comment;
    #follow;
  };

  public type Message = {
    id : MessageId;
    senderId : UserId;
    receiverId : UserId;
    text : Text;
    createdAt : Time.Time;
  };

  module Message {
    public func compareByCreatedAt(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.createdAt, message2.createdAt);
    };
  };

  module Post {
    public func compareByCreatedAt(post1 : Post, post2 : Post) : Order.Order {
      Int.compare(post1.createdAt, post2.createdAt);
    };
  };

  // Storage
  let users = Map.empty<UserId, UserProfile>();
  var nextPostId = 0;
  let posts = Map.empty<PostId, Post>();
  let likes = Map.empty<PostId, List.List<UserId>>();
  let comments = Map.empty<PostId, List.List<Comment>>();
  let follows = Map.empty<UserId, List.List<UserId>>();
  var nextNotificationId = 0;
  let notifications = Map.empty<NotificationId, Notification>();
  var nextMessageId = 0;
  let messages = Map.empty<MessageId, Message>();

  // Helper Functions
  func ensureUserExists(userId : UserId) {
    if (not users.containsKey(userId)) {
      Runtime.trap("User does not exist");
    };
  };

  func addLike(postId : PostId, userId : UserId) {
    let currentLikes = switch (likes.get(postId)) {
      case (null) { List.empty<UserId>() };
      case (?l) { l };
    };
    if (currentLikes.any(func(id) { id == userId })) { return };
    currentLikes.add(userId);
    likes.add(postId, currentLikes);
  };

  func removeLike(postId : PostId, userId : UserId) {
    switch (likes.get(postId)) {
      case (null) { () };
      case (?currentLikes) {
        let filteredLikes = currentLikes.filter(func(id) { id != userId });
        likes.add(postId, filteredLikes);
      };
    };
  };

  func addComment(comment : Comment) {
    let currentComments = switch (comments.get(comment.postId)) {
      case (null) { List.empty<Comment>() };
      case (?c) { c };
    };
    currentComments.add(comment);
    comments.add(comment.postId, currentComments);
  };

  func addFollower(followerId : UserId, followeeId : UserId) {
    let currentFollowers = switch (follows.get(followeeId)) {
      case (null) { List.empty<UserId>() };
      case (?f) { f };
    };
    if (currentFollowers.any(func(id) { id == followerId })) { return };
    currentFollowers.add(followerId);
    follows.add(followeeId, currentFollowers);
  };

  func removeFollower(followerId : UserId, followeeId : UserId) {
    switch (follows.get(followeeId)) {
      case (null) { () };
      case (?currentFollowers) {
        let filteredFollowers = currentFollowers.filter(func(id) { id != followerId });
        follows.add(followeeId, filteredFollowers);
      };
    };
  };

  func putNotification(notification : Notification) {
    notifications.add(notification.id, notification);
  };

  // Required profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(userId : UserId) : async ?UserProfile {
    // Public profiles are viewable by anyone (including guests)
    users.get(userId);
  };

  // Register user - creates initial profile
  public shared ({ caller }) func registerUser(username : Text, displayName : Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
    };
    users.add(caller, profile);
    profile;
  };

  // Update profile
  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text, profilePhoto : ?Storage.ExternalBlob) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          username = profile.username;
          displayName;
          bio;
          profilePhoto;
        };
        users.add(caller, updatedProfile);
        updatedProfile;
      };
    };
  };

  // Create post
  public shared ({ caller }) func createPost(media : Storage.ExternalBlob, mediaType : MediaType, caption : Text) : async Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
    };
    let post : Post = {
      id = nextPostId;
      authorId = caller;
      media;
      mediaType;
      caption;
      createdAt = Time.now();
    };
    posts.add(nextPostId, post);
    nextPostId += 1;
    post;
  };

  // Get post (public)
  public query func getPost(postId : PostId) : async ?Post {
    posts.get(postId);
  };

  // Get home feed (posts from followed users)
  public query ({ caller }) func getHomeFeed(page : Nat, pageSize : Nat) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view home feed");
    };
    let followedUsers = switch (follows.get(caller)) {
      case (null) { List.empty<UserId>() };
      case (?f) { f };
    };
    let allPosts = posts.values().toArray();
    let feedPosts = allPosts.filter(func(post) {
      followedUsers.any(func(userId) { userId == post.authorId });
    });
    let sorted = feedPosts.sort(Post.compareByCreatedAt);
    let start = page * pageSize;
    let end = start + pageSize;
    if (start >= sorted.size()) { [] } else {
      sorted.sliceToArray(start, Nat.min(end, sorted.size()));
    };
  };


  // Get explore feed (all recent posts)
  public query func getExploreFeed(page : Nat, pageSize : Nat) : async [Post] {
    // Public - no auth required
    let allPosts = posts.values().toArray();
    let sorted = allPosts.sort(Post.compareByCreatedAt);
    let start = page * pageSize;
    let end = start + pageSize;
    if (start >= sorted.size()) { [] } else {
      sorted.sliceToArray(start, Nat.min(end, sorted.size()));
    };
  };

  // Like/unlike post
  public shared ({ caller }) func toggleLike(postId : PostId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        switch (likes.get(postId)) {
          case (null) {
            addLike(postId, caller);
            // Create notification
            if (post.authorId != caller) {
              let notification : Notification = {
                id = nextNotificationId;
                recipientId = post.authorId;
                type_ = #like;
                actorId = caller;
                postId = ?postId;
                createdAt = Time.now();
                read = false;
              };
              putNotification(notification);
              nextNotificationId += 1;
            };
            true;
          };
          case (?currentLikes) {
            if (currentLikes.any(func(id) { id == caller })) {
              removeLike(postId, caller);
              false;
            } else {
              addLike(postId, caller);
              // Create notification
              if (post.authorId != caller) {
                let notification : Notification = {
                  id = nextNotificationId;
                  recipientId = post.authorId;
                  type_ = #like;
                  actorId = caller;
                  postId = ?postId;
                  createdAt = Time.now();
                  read = false;
                };
                putNotification(notification);
                nextNotificationId += 1;
              };
              true;
            };
          };
        };
      };
    };
  };

  // Get post likes (public)
  public query func getPostLikes(postId : PostId) : async [UserId] {
    switch (likes.get(postId)) {
      case (null) { [] };
      case (?l) { l.toArray() };
    };
  };

  // Add comment
  public shared ({ caller }) func createComment(postId : PostId, text : Text) : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
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
        addComment(comment);
        // Create notification
        if (post.authorId != caller) {
          let notification : Notification = {
            id = nextNotificationId;
            recipientId = post.authorId;
            type_ = #comment;
            actorId = caller;
            postId = ?postId;
            createdAt = Time.now();
            read = false;
          };
          putNotification(notification);
          nextNotificationId += 1;
        };
        comment;
      };
    };
  };

  // Get comments for a post (public)
  public query func getPostComments(postId : PostId) : async [Comment] {
    switch (comments.get(postId)) {
      case (null) { [] };
      case (?c) { c.toArray() };
    };
  };

  // Follow user
  public shared ({ caller }) func followUser(followeeId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
    };
    if (not users.containsKey(followeeId)) { 
      Runtime.trap("User does not exist") 
    };
    if (caller == followeeId) {
      Runtime.trap("Cannot follow yourself");
    };
    addFollower(caller, followeeId);
    // Create notification
    let notification : Notification = {
      id = nextNotificationId;
      recipientId = followeeId;
      type_ = #follow;
      actorId = caller;
      postId = null;
      createdAt = Time.now();
      read = false;
    };
    putNotification(notification);
    nextNotificationId += 1;
  };

  // Unfollow user
  public shared ({ caller }) func unfollowUser(followeeId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
    };
    if (not users.containsKey(followeeId)) { 
      Runtime.trap("User does not exist") 
    };
    removeFollower(caller, followeeId);
  };

  // Get followers (public)
  public query func getFollowers(userId : UserId) : async [UserId] {
    switch (follows.get(userId)) {
      case (null) { [] };
      case (?userFollowers) { userFollowers.toArray() };
    };
  };

  // Get following (public)
  public query func getFollowing(userId : UserId) : async [UserId] {
    let allFollows = follows.entries().toArray();
    let following = allFollows.filter(func((followeeId, followers)) {
      followers.any(func(followerId) { followerId == userId });
    });
    following.map(func((followeeId, _)) { followeeId });
  };

  // Get user's notifications (owner only)
  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    notifications.values().toArray().filter(func(notification) { 
      notification.recipientId == caller 
    });
  };

  // Mark notifications as read (owner only)
  public shared ({ caller }) func markNotificationsAsRead(notificationIds : [NotificationId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    notificationIds.forEach(func(id) {
      switch (notifications.get(id)) {
        case (null) { () };
        case (?notification) {
          if (notification.recipientId != caller) {
            Runtime.trap("Unauthorized: Can only mark your own notifications as read");
          };
          let updatedNotification = {
            id = notification.id;
            recipientId = notification.recipientId;
            type_ = notification.type_;
            actorId = notification.actorId;
            postId = notification.postId;
            createdAt = notification.createdAt;
            read = true;
          };
          notifications.add(id, updatedNotification);
        };
      };
    });
  };

  // Send message
  public shared ({ caller }) func sendMessage(receiverId : UserId, text : Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (not users.containsKey(caller)) { 
      Runtime.trap("User not registered") 
    };
    if (not users.containsKey(receiverId)) { 
      Runtime.trap("User does not exist") 
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

  // Get conversation history (participants only)
  public query ({ caller }) func getConversation(otherUserId : UserId) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    messages.values().toArray().filter(
      func(message) {
        (message.senderId == caller and message.receiverId == otherUserId) or 
        (message.senderId == otherUserId and message.receiverId == caller);
      }
    ).sort(Message.compareByCreatedAt);
  };

  // Get recent conversations (owner only)
  public query ({ caller }) func getRecentConversations() : async [UserId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    let userMessages = messages.values().toArray().filter(func(message) {
      message.senderId == caller or message.receiverId == caller;
    });
    let conversationPartners = Map.empty<UserId, Time.Time>();
    userMessages.forEach(func(message) {
      let partnerId = if (message.senderId == caller) { message.receiverId } else { message.senderId };
      switch (conversationPartners.get(partnerId)) {
        case (null) { conversationPartners.add(partnerId, message.createdAt) };
        case (?lastTime) {
          if (message.createdAt > lastTime) {
            conversationPartners.add(partnerId, message.createdAt);
          };
        };
      };
    });
    let sorted = conversationPartners.entries().toArray().sort(func((_, timeA), (_, timeB)) {
      Int.compare(timeA, timeB);
    });
    sorted.map(func((userId, _)) { userId });
  };

  // Search users by username prefix (public)
  public query func searchUsers(prefix : Text) : async [UserProfile] {
    users.values().toArray().filter(func(profile) {
      profile.username.startsWith(#text prefix);
    });
  };

  // Get user's posts (public)
  public query func getUserPosts(userId : UserId) : async [Post] {
    posts.values().toArray().filter(func(post) { 
      post.authorId == userId 
    }).sort(Post.compareByCreatedAt);
  };
};
