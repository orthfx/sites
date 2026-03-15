import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">{church.name}</h1>
          {church.jurisdiction && (
            <p className="mt-1 text-muted-foreground">{church.jurisdiction}</p>
          )}
        </div>

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
            <div className="flex flex-col gap-1">
              {personnel.map((person) => (
                <div key={person._id}>
                  <span className="font-medium">{person.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {person.title}
                  </span>
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
        <a href="https://orthfx.org" className="underline">
          orthfx.org
        </a>
      </footer>
    </div>
  );
}
