import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  communities: defineTable({
    name: v.string(),
    slug: v.string(),
    customDomain: v.optional(v.string()),
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
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_customDomain", ["customDomain"])
    .index("by_status", ["status"])
    .index("by_jurisdiction", ["jurisdiction"]),

  personnel: defineTable({
    communityId: v.id("communities"),
    name: v.string(),
    title: v.string(),
    order: v.number(),
    avatarId: v.optional(v.id("_storage")),
  }).index("by_communityId", ["communityId"]),

  roles: defineTable({
    userId: v.id("users"),
    communityId: v.optional(v.id("communities")),
    jurisdictionId: v.optional(v.string()),
    role: v.union(
      v.literal("system_admin"),
      v.literal("jurisdiction_admin"),
      v.literal("admin"),
      v.literal("editor")
    ),
    roleStatus: v.union(v.literal("active"), v.literal("pending")),
  })
    .index("by_userId", ["userId"])
    .index("by_communityId", ["communityId"])
    .index("by_jurisdictionId", ["jurisdictionId"])
    .index("by_userId_communityId", ["userId", "communityId"]),
});
