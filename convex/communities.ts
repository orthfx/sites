import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import {
  assertCanEditCommunity,
  canDeleteCommunity,
  isSystemAdmin,
} from "./auth.helpers";

async function resolveImageUrls(
  ctx: QueryCtx,
  community: { avatarId?: Id<"_storage">; bannerId?: Id<"_storage"> }
) {
  return {
    avatarUrl: community.avatarId
      ? await ctx.storage.getUrl(community.avatarId)
      : null,
    bannerUrl: community.bannerId
      ? await ctx.storage.getUrl(community.bannerId)
      : null,
  };
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const communities = await ctx.db.query("communities").collect();
    const published = communities.filter((c) => c.published);
    return Promise.all(
      published.map(async (c) => ({
        ...c,
        ...(await resolveImageUrls(ctx, c)),
      }))
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!community) return null;
    return { ...community, ...(await resolveImageUrls(ctx, community)) };
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userRoles = await ctx.db
      .query("roles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const activeRoles = userRoles.filter((r) => r.roleStatus === "active");

    // System admins see all communities
    const isSysAdmin = activeRoles.some((r) => r.role === "system_admin");
    if (isSysAdmin) {
      const all = await ctx.db.query("communities").collect();
      return Promise.all(
        all.map(async (c) => ({
          ...c,
          ...(await resolveImageUrls(ctx, c)),
          role: "system_admin" as const,
        }))
      );
    }

    // Collect community IDs from direct roles
    const communityIds = new Set<string>();
    const roleMap = new Map<string, string>();

    for (const r of activeRoles) {
      if (r.communityId) {
        communityIds.add(r.communityId);
        roleMap.set(r.communityId, r.role);
      }
    }

    // Jurisdiction admins: find communities matching their jurisdictions
    const jurisdictionRoles = activeRoles.filter(
      (r) => r.role === "jurisdiction_admin" && r.jurisdictionId
    );
    if (jurisdictionRoles.length > 0) {
      const allCommunities = await ctx.db.query("communities").collect();
      for (const community of allCommunities) {
        if (
          community.jurisdiction &&
          jurisdictionRoles.some(
            (r) => r.jurisdictionId === community.jurisdiction
          )
        ) {
          if (!communityIds.has(community._id)) {
            communityIds.add(community._id);
            roleMap.set(community._id, "jurisdiction_admin");
          }
        }
      }
    }

    // Fetch all communities by ID
    const communities = await Promise.all(
      [...communityIds].map((id) => ctx.db.get(id as Id<"communities">))
    );

    return Promise.all(
      communities
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map(async (c) => ({
          ...c,
          ...(await resolveImageUrls(ctx, c)),
          role: roleMap.get(c._id) ?? "editor",
        }))
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    type: v.optional(
      v.union(
        v.literal("parish"),
        v.literal("mission"),
        v.literal("monastery"),
        v.literal("chapel"),
        v.literal("cathedral")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("That subdomain is already taken");

    if (!/^[a-z0-9-]+$/.test(args.slug)) {
      throw new Error(
        "Subdomain can only contain lowercase letters, numbers, and hyphens"
      );
    }

    const communityId = await ctx.db.insert("communities", {
      name: args.name,
      slug: args.slug,
      type: args.type ?? "parish",
      status: "verified",
      published: false,
    });

    await ctx.db.insert("roles", {
      userId,
      communityId,
      role: "admin",
      roleStatus: "active",
    });

    return communityId;
  },
});

export const update = mutation({
  args: {
    id: v.id("communities"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("parish"),
        v.literal("mission"),
        v.literal("monastery"),
        v.literal("chapel"),
        v.literal("cathedral")
      )
    ),
    jurisdiction: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    avatarId: v.optional(v.id("_storage")),
    bannerId: v.optional(v.id("_storage")),
    services: v.optional(
      v.array(
        v.object({
          name: v.string(),
          day: v.string(),
          time: v.string(),
        })
      )
    ),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanEditCommunity(ctx, userId, args.id);

    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(await canDeleteCommunity(ctx, userId, args.id))) {
      throw new Error("Not authorized");
    }

    // Delete associated personnel
    const personnel = await ctx.db
      .query("personnel")
      .withIndex("by_communityId", (q) => q.eq("communityId", args.id))
      .collect();
    for (const p of personnel) {
      await ctx.db.delete(p._id);
    }

    // Delete associated roles
    const roles = await ctx.db
      .query("roles")
      .withIndex("by_communityId", (q) => q.eq("communityId", args.id))
      .collect();
    for (const r of roles) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const claim = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const community = await ctx.db.get(args.id);
    if (!community) throw new Error("Not found");
    if (community.status !== "unclaimed") {
      throw new Error("This community has already been claimed");
    }

    await ctx.db.patch(args.id, { status: "pending" });

    await ctx.db.insert("roles", {
      userId,
      communityId: args.id,
      role: "admin",
      roleStatus: "pending",
    });
  },
});

export const approveClaim = mutation({
  args: {
    communityId: v.id("communities"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Must be system_admin or jurisdiction_admin
    const isSysAdmin = await isSystemAdmin(ctx, userId);
    if (!isSysAdmin) {
      const community = await ctx.db.get(args.communityId);
      if (!community) throw new Error("Not found");

      if (community.jurisdiction) {
        const userRoles = await ctx.db
          .query("roles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
        const hasJurisdictionAccess = userRoles.some(
          (r) =>
            r.role === "jurisdiction_admin" &&
            r.roleStatus === "active" &&
            r.jurisdictionId === community.jurisdiction
        );
        if (!hasJurisdictionAccess) throw new Error("Not authorized");
      } else {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.patch(args.roleId, { roleStatus: "active" });
    await ctx.db.patch(args.communityId, { status: "verified" });
  },
});
