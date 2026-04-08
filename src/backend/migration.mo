import Map "mo:core/Map";
import List "mo:core/List";

module {

  // ── Old types (inline from previous deployment) ────────────────────────────

  type OldUserId = Principal;
  type OldPostId = Nat;
  type OldNotificationId = Nat;
  type OldMessageId = Nat;
  type OldTime = Int;

  type OldMediaType = { #photo; #video };

  type OldUserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePhoto : ?Blob; // was ExternalBlob = Blob
  };

  type OldPost = {
    id : OldPostId;
    authorId : OldUserId;
    media : Blob; // was ExternalBlob = Blob
    mediaType : OldMediaType;
    caption : Text;
    createdAt : OldTime;
  };

  type OldComment = {
    postId : OldPostId;
    authorId : OldUserId;
    text : Text;
    createdAt : OldTime;
  };

  type OldNotificationType = { #like; #comment; #follow };

  type OldNotification = {
    id : OldNotificationId;
    recipientId : OldUserId;
    type_ : OldNotificationType;
    actorId : OldUserId;
    postId : ?OldPostId;
    createdAt : OldTime;
    read : Bool;
  };

  type OldMessage = {
    id : OldMessageId;
    senderId : OldUserId;
    receiverId : OldUserId;
    text : Text;
    createdAt : OldTime;
  };

  // ── New types (mirror of main.mo) ─────────────────────────────────────────

  type NewMediaType = { #photo; #video };

  type NewUserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePhoto : ?Text;
    pronouns : ?Text;
    socialLinks : [Text];
  };

  type NewPost = {
    id : OldPostId;
    authorId : OldUserId;
    mediaUrl : Text;
    mediaType : NewMediaType;
    caption : Text;
    location : ?Text;
    tags : [Text];
    createdAt : Int;
  };

  type NewComment = {
    postId : OldPostId;
    authorId : OldUserId;
    text : Text;
    createdAt : Int;
  };

  type NewNotificationType = {
    #like;
    #comment;
    #follow;
    #referralSignup;
    #referralReel;
    #referralFollowers;
  };

  type NewNotification = {
    id : OldNotificationId;
    recipientId : OldUserId;
    type_ : NewNotificationType;
    actorId : OldUserId;
    postId : ?OldPostId;
    message : ?Text;
    createdAt : Int;
    read : Bool;
  };

  type NewMessage = {
    id : OldMessageId;
    senderId : OldUserId;
    receiverId : OldUserId;
    text : Text;
    createdAt : Int;
  };

  // ── State record types ────────────────────────────────────────────────────

  type OldActor = {
    users : Map.Map<OldUserId, OldUserProfile>;
    var nextPostId : Nat;
    posts : Map.Map<OldPostId, OldPost>;
    likes : Map.Map<OldPostId, List.List<OldUserId>>;
    comments : Map.Map<OldPostId, List.List<OldComment>>;
    follows : Map.Map<OldUserId, List.List<OldUserId>>;
    var nextNotificationId : Nat;
    notifications : Map.Map<OldNotificationId, OldNotification>;
    var nextMessageId : Nat;
    messages : Map.Map<OldMessageId, OldMessage>;
  };

  type NewActor = {
    users : Map.Map<OldUserId, NewUserProfile>;
    var nextPostId : Nat;
    posts : Map.Map<OldPostId, NewPost>;
    likes : Map.Map<OldPostId, List.List<OldUserId>>;
    comments : Map.Map<OldPostId, List.List<NewComment>>;
    follows : Map.Map<OldUserId, List.List<OldUserId>>;
    var nextNotificationId : Nat;
    notifications : Map.Map<OldNotificationId, NewNotification>;
    var nextMessageId : Nat;
    messages : Map.Map<OldMessageId, NewMessage>;
  };

  // ── Migration function ────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Migrate users: Blob profilePhoto -> Text (drop the blob, set null), add new fields
    let newUsers = old.users.map<OldUserId, OldUserProfile, NewUserProfile>(
      func(_uid, p) {
        {
          username = p.username;
          displayName = p.displayName;
          bio = p.bio;
          profilePhoto = null; // old blob photo cannot be converted to URL; reset
          pronouns = null;
          socialLinks = [];
        };
      }
    );

    // Migrate posts: rename media->mediaUrl (blob to URL text), add location/tags
    let newPosts = old.posts.map<OldPostId, OldPost, NewPost>(
      func(_pid, p) {
        {
          id = p.id;
          authorId = p.authorId;
          mediaUrl = ""; // old blob cannot be converted; reset
          mediaType = p.mediaType;
          caption = p.caption;
          location = null;
          tags = [];
          createdAt = p.createdAt;
        };
      }
    );

    // Migrate comments: same shape, just Int time
    let newComments = old.comments.map<OldPostId, List.List<OldComment>, List.List<NewComment>>(
      func(_pid, commentList) {
        commentList.map<OldComment, NewComment>(func(c) {
          { c with createdAt = c.createdAt };
        });
      }
    );

    // Migrate notifications: add message = null field, widen NotificationType
    let newNotifications = old.notifications.map<OldNotificationId, OldNotification, NewNotification>(
      func(_nid, n) {
        {
          id = n.id;
          recipientId = n.recipientId;
          type_ = n.type_;
          actorId = n.actorId;
          postId = n.postId;
          message = null;
          createdAt = n.createdAt;
          read = n.read;
        };
      }
    );

    // Migrate messages: same shape
    let newMessages = old.messages.map<OldMessageId, OldMessage, NewMessage>(
      func(_mid, m) { m }
    );

    {
      users = newUsers;
      var nextPostId = old.nextPostId;
      posts = newPosts;
      likes = old.likes;
      comments = newComments;
      follows = old.follows;
      var nextNotificationId = old.nextNotificationId;
      notifications = newNotifications;
      var nextMessageId = old.nextMessageId;
      messages = newMessages;
    };
  };
};
