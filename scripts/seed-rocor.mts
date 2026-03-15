/**
 * Seed ROCOR parishes into Convex.
 *
 * Usage:
 *   npx tsx scripts/seed-rocor.mts
 *
 * This transforms the ROCOR data and writes batched JSON files,
 * then calls `npx convex run` for each batch.
 *
 * Alternatively, you can run the seed directly:
 *   npx convex run seed:batchInsertCommunities --args "$(cat batch-0.json)"
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROCOR_DATA_PATH = path.resolve(
  import.meta.dirname,
  "../../../_local/rocor-parishes/rocor_parishes_detailed.json"
);

const PROJECT_DIR = path.resolve(import.meta.dirname, "..");

interface RocorParish {
  uid: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  organization?: string;
  physical_address?: {
    full: string;
    lines: string[];
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  clergy?: Array<{
    name: string;
    uid: string;
    role?: string;
  }>;
}

function slugify(name: string, uid: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${uid}`;
}

function parseAddress(parish: RocorParish): {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const result: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } = {};

  if (parish.city) {
    const cityPart = parish.city.split(",")[0].trim();
    if (cityPart) result.city = cityPart;
  }

  if (parish.state) result.state = parish.state;

  if (parish.physical_address?.lines) {
    const lines = parish.physical_address.lines.filter(
      (l) =>
        l.trim() &&
        l !== "United States" &&
        !l.startsWith("Same as") &&
        !/^,\s*[A-Z]{2}$/.test(l.trim())
    );

    if (lines.length >= 2) {
      result.address = lines[0].trim();
      const cityStateZip = lines[1].trim();
      const zipMatch = cityStateZip.match(/(\d{5}(-\d{4})?)$/);
      if (zipMatch) result.zip = zipMatch[1];
    } else if (lines.length === 1) {
      const zipMatch = lines[0].match(/(\d{5}(-\d{4})?)$/);
      if (zipMatch) result.zip = zipMatch[1];
    }
  }

  return result;
}

function detectType(
  name: string
): "parish" | "mission" | "monastery" | "chapel" | "cathedral" {
  const lower = name.toLowerCase();
  if (
    lower.includes("monastery") ||
    lower.includes("monastic") ||
    lower.includes("skete")
  )
    return "monastery";
  if (lower.includes("mission")) return "mission";
  if (lower.includes("chapel")) return "chapel";
  if (lower.includes("cathedral")) return "cathedral";
  return "parish";
}

function transformParish(parish: RocorParish) {
  const addr = parseAddress(parish);
  const personnel = (parish.clergy ?? [])
    .filter((c) => c.name)
    .map((c) => ({
      name: c.name,
      title: c.role ?? "Clergy",
    }));

  const community: Record<string, unknown> = {
    name: parish.name,
    slug: slugify(parish.name, parish.uid),
    type: detectType(parish.name),
    status: "unclaimed",
    published: true,
    personnel,
  };

  // Only include optional fields if they have values
  if (parish.organization) community.jurisdiction = parish.organization;
  if (addr.address) community.address = addr.address;
  if (addr.city) community.city = addr.city;
  if (addr.state) community.state = addr.state;
  if (addr.zip) community.zip = addr.zip;
  if (parish.contact?.phone) community.phone = parish.contact.phone;
  if (parish.contact?.email) community.email = parish.contact.email;
  if (parish.contact?.website) community.website = parish.contact.website;
  if (parish.latitude != null) community.latitude = parish.latitude;
  if (parish.longitude != null) community.longitude = parish.longitude;

  return community;
}

async function main() {
  console.log(`Reading data from ${ROCOR_DATA_PATH}...`);
  const raw: RocorParish[] = JSON.parse(
    fs.readFileSync(ROCOR_DATA_PATH, "utf-8")
  );
  console.log(`Loaded ${raw.length} parishes`);

  const transformed = raw.map(transformParish);

  // Deduplicate slugs
  const slugCounts = new Map<string, number>();
  for (const t of transformed) {
    const slug = t.slug as string;
    const count = slugCounts.get(slug) ?? 0;
    if (count > 0) {
      t.slug = `${slug}-${count}`;
    }
    slugCounts.set(slug, count + 1);
  }

  // Batch in groups of 25
  const BATCH_SIZE = 25;
  const totalBatches = Math.ceil(transformed.length / BATCH_SIZE);
  let totalCommunities = 0;
  let totalPersonnel = 0;

  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const argsJson = JSON.stringify({ communities: batch });

    try {
      const result = execSync(
        `npx convex run seed:batchInsertCommunities '${argsJson.replace(/'/g, "'\\''")}'`,
        {
          cwd: PROJECT_DIR,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        }
      );
      console.log(`Batch ${batchNum}/${totalBatches}: done`);

      // Parse result if available
      const match = result.match(/\{.*\}/s);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          totalCommunities += parsed.communitiesInserted ?? 0;
          totalPersonnel += parsed.personnelInserted ?? 0;
        } catch {
          // Result parsing is best-effort
        }
      }
    } catch (err: any) {
      console.error(`Batch ${batchNum} failed:`, err.stderr || err.message);
    }
  }

  console.log(
    `\nDone! Inserted ~${totalCommunities} communities and ~${totalPersonnel} personnel.`
  );
}

main().catch(console.error);
