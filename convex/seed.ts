import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const batchInsertCommunities = internalMutation({
  args: {
    communities: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        type: v.union(
          v.literal("parish"),
          v.literal("mission"),
          v.literal("monastery"),
          v.literal("chapel"),
          v.literal("cathedral")
        ),
        status: v.union(
          v.literal("verified"),
          v.literal("unclaimed"),
          v.literal("pending")
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
        published: v.boolean(),
        personnel: v.array(
          v.object({
            name: v.string(),
            title: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    let communitiesInserted = 0;
    let personnelInserted = 0;

    for (const entry of args.communities) {
      const { personnel, ...communityData } = entry;

      // Check for duplicate slug
      const existing = await ctx.db
        .query("communities")
        .withIndex("by_slug", (q) => q.eq("slug", communityData.slug))
        .unique();
      if (existing) {
        console.log(`Skipping duplicate slug: ${communityData.slug}`);
        continue;
      }

      const communityId = await ctx.db.insert("communities", communityData);
      communitiesInserted++;

      for (let i = 0; i < personnel.length; i++) {
        await ctx.db.insert("personnel", {
          communityId,
          name: personnel[i].name,
          title: personnel[i].title,
          order: i,
        });
        personnelInserted++;
      }
    }

    return { communitiesInserted, personnelInserted };
  },
});
