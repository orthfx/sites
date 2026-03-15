import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Map,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";
import { useState } from "react";

export function PublicParishPage({ slug }: { slug: string }) {
  const community = useQuery(api.communities.getBySlug, { slug });

  if (community === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (community === null || !community.published) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Parish not found</h1>
          <p className="mt-2 text-muted-foreground">
            This parish page doesn't exist or hasn't been published yet.
          </p>
        </div>
      </div>
    );
  }

  return <ParishPage community={community} />;
}

interface Community {
  _id: string;
  name: string;
  slug: string;
  type: "parish" | "mission" | "monastery" | "chapel" | "cathedral";
  status: "verified" | "unclaimed" | "pending";
  jurisdiction?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  avatarUrl: string | null;
  bannerUrl: string | null;
  services?: { name: string; day: string; time: string }[];
}

function ParishPage({ community }: { community: Community }) {
  const personnel = useQuery(api.personnel.listByCommunity, {
    communityId: community._id as never,
  });
  const { isAuthenticated } = useConvexAuth();
  const claim = useMutation(api.communities.claim);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const fullAddress = [
    community.address,
    community.city,
    community.state,
    community.zip,
  ]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = fullAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
    : null;

  const hasCoords =
    community.latitude !== undefined && community.longitude !== undefined;

  async function handleClaim() {
    setClaiming(true);
    try {
      await claim({ id: community._id as never });
      setClaimed(true);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner */}
      {community.bannerUrl && (
        <div className="h-48 w-full overflow-hidden sm:h-64">
          <img
            src={community.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          {community.avatarUrl && (
            <img
              src={community.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{community.name}</h1>
            {community.jurisdiction && (
              <p className="mt-1 text-muted-foreground">
                {community.jurisdiction}
              </p>
            )}
          </div>
        </div>

        {/* Claim button */}
        {community.status === "unclaimed" && isAuthenticated && !claimed && (
          <section className="mb-8">
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? "Claiming..." : "Claim this community"}
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you affiliated with this community? Claim it to manage its
              page.
            </p>
          </section>
        )}
        {claimed && (
          <section className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Your claim has been submitted and is pending review.
          </section>
        )}

        {/* Map */}
        {hasCoords && (
          <section className="mb-8">
            <div className="h-64 overflow-hidden rounded-lg border">
              <Map
                center={[community.longitude!, community.latitude!]}
                zoom={14}
              >
                <MapMarker
                  longitude={community.longitude!}
                  latitude={community.latitude!}
                >
                  <MarkerContent>
                    <div className="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow-lg" />
                  </MarkerContent>
                </MapMarker>
                <MapControls showZoom position="bottom-right" />
              </Map>
            </div>
          </section>
        )}

        {/* Location */}
        {fullAddress && (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </h2>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {fullAddress}
              </a>
            ) : (
              <p>{fullAddress}</p>
            )}
          </section>
        )}

        {/* Services */}
        {community.services && community.services.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Services
            </h2>
            <div className="flex flex-col gap-2">
              {community.services.map((service, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {service.day}
                    </span>
                  </div>
                  <span>{service.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Personnel */}
        {personnel && personnel.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Clergy & Personnel
            </h2>
            <div className="flex flex-col gap-3">
              {personnel.map((person) => (
                <div key={person._id} className="flex items-center gap-3">
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  )}
                  <div>
                    <span className="font-medium">{person.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {person.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {(community.phone || community.email || community.website) && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contact
            </h2>
            <div className="flex flex-col gap-1">
              {community.phone && <p>{community.phone}</p>}
              {community.email && (
                <a
                  href={`mailto:${community.email}`}
                  className="underline"
                >
                  {community.email}
                </a>
              )}
              {community.website && (
                <a
                  href={community.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {community.website}
                </a>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <a href="https://orthdx.site" className="underline">
          orthdx.site
        </a>
      </footer>
    </div>
  );
}
