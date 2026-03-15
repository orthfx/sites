import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByChurch = query({
  args: { churchId: v.id("churches") },
  handler: async (ctx, args) => {
    const personnel = await ctx.db
      .query("personnel")
      .withIndex("by_churchId", (q) => q.eq("churchId", args.churchId))
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
    churchId: v.id("churches"),
    name: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const church = await ctx.db.get(args.churchId);
    if (!church || church.userId !== userId) throw new Error("Not authorized");

    const existing = await ctx.db
      .query("personnel")
      .withIndex("by_churchId", (q) => q.eq("churchId", args.churchId))
      .collect();
    const maxOrder = existing.reduce((max, p) => Math.max(max, p.order), -1);

    return await ctx.db.insert("personnel", {
      churchId: args.churchId,
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

    const church = await ctx.db.get(person.churchId);
    if (!church || church.userId !== userId) throw new Error("Not authorized");

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

    const church = await ctx.db.get(person.churchId);
    if (!church || church.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
