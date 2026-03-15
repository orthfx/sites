import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-lg font-semibold">orthfx/sites</span>
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

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
            A free website for your parish
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Many Orthodox parishes have no web presence at all. orthfx/sites
            gives every Orthodox church a free, clean single page with just the
            essentials: who you are, where you are, when services are, and who
            to contact.
          </p>
          <Link
            to="/signup"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Create your parish page
          </Link>
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        A free service from orthfx
      </footer>
    </div>
  );
}
