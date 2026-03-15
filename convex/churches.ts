import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("churches")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("churches")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check slug uniqueness
    const existing = await ctx.db
      .query("churches")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("That subdomain is already taken");

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(args.slug)) {
      throw new Error("Subdomain can only contain lowercase letters, numbers, and hyphens");
    }

    return await ctx.db.insert("churches", {
      userId,
      name: args.name,
      slug: args.slug,
      published: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("churches"),
    name: v.optional(v.string()),
    jurisdiction: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
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

    const church = await ctx.db.get(args.id);
    if (!church || church.userId !== userId) throw new Error("Not authorized");

    const { id, ...fields } = args;
    // Remove undefined values
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(id, updates);
  },
});
