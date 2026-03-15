import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Map,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";

export function PublicParishPage({ slug }: { slug: string }) {
  const church = useQuery(api.churches.getBySlug, { slug });

  if (church === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (church === null || !church.published) {
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

  return <ParishPage church={church} />;
}

interface Church {
  _id: string;
  name: string;
  slug: string;
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

function ParishPage({ church }: { church: Church }) {
  const personnel = useQuery(api.personnel.listByChurch, {
    churchId: church._id as never,
  });

  const fullAddress = [church.address, church.city, church.state, church.zip]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = fullAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
    : null;

  const hasCoords =
    church.latitude !== undefined && church.longitude !== undefined;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner */}
      {church.bannerUrl && (
        <div className="h-48 w-full overflow-hidden sm:h-64">
          <img
            src={church.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          {church.avatarUrl && (
            <img
              src={church.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{church.name}</h1>
            {church.jurisdiction && (
              <p className="mt-1 text-muted-foreground">
                {church.jurisdiction}
              </p>
            )}
          </div>
        </div>

        {/* Map */}
        {hasCoords && (
          <section className="mb-8">
            <div className="h-64 overflow-hidden rounded-lg border">
              <Map
                center={[church.longitude!, church.latitude!]}
                zoom={14}
              >
                <MapMarker
                  longitude={church.longitude!}
                  latitude={church.latitude!}
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
        {church.services && church.services.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Services
            </h2>
            <div className="flex flex-col gap-2">
              {church.services.map((service, i) => (
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
        {(church.phone || church.email || church.website) && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contact
            </h2>
            <div className="flex flex-col gap-1">
              {church.phone && <p>{church.phone}</p>}
              {church.email && (
                <a href={`mailto:${church.email}`} className="underline">
                  {church.email}
                </a>
              )}
              {church.website && (
                <a
                  href={church.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {church.website}
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
