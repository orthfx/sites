import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  churches: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    customDomain: v.optional(v.string()),
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
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_customDomain", ["customDomain"])
    .index("by_userId", ["userId"]),

  personnel: defineTable({
    churchId: v.id("churches"),
    name: v.string(),
    title: v.string(),
    order: v.number(),
  }).index("by_churchId", ["churchId"]),
});
