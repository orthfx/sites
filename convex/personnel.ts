import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCanEditCommunity } from "./auth.helpers";

export const listByCommunity = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const personnel = await ctx.db
      .query("personnel")
      .withIndex("by_communityId", (q) =>
        q.eq("communityId", args.communityId)
      )
      .collect();
    const sorted = personnel.sort((a, b) => a.order - b.order);
    return Promise.all(
      sorted.map(async (p) => ({
        ...p,
        avatarUrl: p.avatarId
          ? await ctx.storage.getUrl(p.avatarId)
          : null,
      }))
    );
  },
});

export const add = mutation({
  args: {
    communityId: v.id("communities"),
    name: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanEditCommunity(ctx, userId, args.communityId);

    const existing = await ctx.db
      .query("personnel")
      .withIndex("by_communityId", (q) =>
        q.eq("communityId", args.communityId)
      )
      .collect();
    const maxOrder = existing.reduce((max, p) => Math.max(max, p.order), -1);

    return await ctx.db.insert("personnel", {
      communityId: args.communityId,
      name: args.name,
      title: args.title,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("personnel"),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const person = await ctx.db.get(args.id);
    if (!person) throw new Error("Not found");

    await assertCanEditCommunity(ctx, userId, person.communityId);

    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("personnel") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const person = await ctx.db.get(args.id);
    if (!person) throw new Error("Not found");

    await assertCanEditCommunity(ctx, userId, person.communityId);

    await ctx.db.delete(args.id);
  },
});
