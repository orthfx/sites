import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export async function isSystemAdmin(
  ctx: Ctx,
  userId: Id<"users">
): Promise<boolean> {
  const roles = await ctx.db
    .query("roles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return roles.some(
    (r) => r.role === "system_admin" && r.roleStatus === "active"
  );
}

export async function getUserRoleForCommunity(
  ctx: Ctx,
  userId: Id<"users">,
  communityId: Id<"communities">
): Promise<string | null> {
  // Check system_admin first
  if (await isSystemAdmin(ctx, userId)) return "system_admin";

  // Check direct community role
  const directRoles = await ctx.db
    .query("roles")
    .withIndex("by_userId_communityId", (q) =>
      q.eq("userId", userId).eq("communityId", communityId)
    )
    .collect();
  const activeDirectRole = directRoles.find(
    (r) => r.roleStatus === "active"
  );
  if (activeDirectRole) return activeDirectRole.role;

  // Check jurisdiction_admin
  const community = await ctx.db.get(communityId);
  if (community?.jurisdiction) {
    const userRoles = await ctx.db
      .query("roles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const jurisdictionRole = userRoles.find(
      (r) =>
        r.role === "jurisdiction_admin" &&
        r.roleStatus === "active" &&
        r.jurisdictionId === community.jurisdiction
    );
    if (jurisdictionRole) return "jurisdiction_admin";
  }

  return null;
}

export async function assertCanEditCommunity(
  ctx: Ctx,
  userId: Id<"users">,
  communityId: Id<"communities">
): Promise<void> {
  const role = await getUserRoleForCommunity(ctx, userId, communityId);
  if (!role) throw new Error("Not authorized");
}

export async function canDeleteCommunity(
  ctx: Ctx,
  userId: Id<"users">,
  communityId: Id<"communities">
): Promise<boolean> {
  const role = await getUserRoleForCommunity(ctx, userId, communityId);
  return role === "system_admin" || role === "jurisdiction_admin" || role === "admin";
}

export async function canManageRoles(
  ctx: Ctx,
  userId: Id<"users">,
  communityId: Id<"communities">
): Promise<boolean> {
  const role = await getUserRoleForCommunity(ctx, userId, communityId);
  return role === "system_admin" || role === "jurisdiction_admin" || role === "admin";
}
