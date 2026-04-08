import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // ── Types (Post has no isDeleted — tracked via deletedPosts Set) ──────────────

  type UserId = Principal;
  type PostId = Nat;

  type MediaType = { #photo; #video };

  type Post = {
    id : PostId;
    authorId : UserId;
    mediaUrl : Text;
    mediaType : MediaType;
    caption : Text;
    location : ?Text;
    tags : [Text];
    createdAt : Int;
  };

  // ── Migration state types ─────────────────────────────────────────────────────

  type OldActor = {
    posts : Map.Map<PostId, Post>;
  };

  type NewActor = {
    posts : Map.Map<PostId, Post>;
  };

  // ── Migration function (passthrough — no structural change to Post) ────────────

  public func run(old : OldActor) : NewActor {
    { posts = old.posts };
  };
};
