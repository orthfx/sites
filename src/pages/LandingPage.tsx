import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const churches = useQuery(api.churches.listPublished);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-lg font-semibold">orthdx.site</span>
          <div className="flex gap-2">
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Log in
            </Link>
            <Link to="/signup" className={cn(buttonVariants())}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6">
        {/* Hero */}
        <section className="py-16 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
            A free website for your parish
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Many Orthodox parishes have no web presence at all. orthdx.site
            gives every Orthodox church a free, clean single page with just the
            essentials: who you are, where you are, when services are, and who
            to contact.
          </p>
          <Link to="/signup" className={cn(buttonVariants({ size: "lg" }))}>
            Create your parish page
          </Link>
        </section>

        {/* Directory */}
        {churches && churches.length > 0 && (
          <section className="border-t py-12">
            <h2 className="mb-6 text-2xl font-semibold">Parish directory</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {churches.map((church) => (
                <a
                  key={church._id}
                  href={`${window.location.protocol}//${church.slug}.${window.location.hostname === "localhost" ? `localhost:${window.location.port}` : "orthdx.site"}`}
                  className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium group-hover:underline">
                    {church.name}
                  </h3>
                  {church.jurisdiction && (
                    <p className="text-sm text-muted-foreground">
                      {church.jurisdiction}
                    </p>
                  )}
                  {(church.city || church.state) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[church.city, church.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        A free service from orthfx
      </footer>
    </div>
  );
}
