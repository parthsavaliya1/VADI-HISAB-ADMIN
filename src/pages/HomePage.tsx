
import { forwardRef } from "react";
import type { ComponentProps, MouseEvent } from "react";

import HubFooter from "../components/HubFooter";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  LayoutGrid,
  LogIn,
  Sprout,
  type LucideIcon,
} from "lucide-react";

type Destination = {
  href: string;
  shortcut: string;
  index: string;
  title: string;
  nav: string;
  kicker: string;
  description: string;
  detail: string;
  points: string[];
  icon: LucideIcon;
  tile: string;
  wash: string;
  chip: string;
};

const destinations: Destination[] = [
  {
    href: "/admin/login",
    shortcut: "1",
    index: "01",
    title: "Admin Login",
    nav: "Admin Login",
    kicker: "Hisab console",
    description: "Users, accounts, listings, and community tools.",
    detail:
      "Sign in to manage Hisab. Review farmer accounts, manage market listings, and support your community.",
    points: ["Accounts", "Listings", "Users", "Reports"],
    icon: LayoutGrid,
    tile: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
    wash: "bg-[radial-gradient(120%_80%_at_100%_0%,hsl(var(--primary)/0.18),transparent_55%)]",
    chip: "bg-[hsl(var(--primary)/0.1)] text-[hsl(20_40%_32%)]",
  },
  {
    href: "https://vadindia.com/login",
    shortcut: "2",
    index: "02",
    title: "Hisab User Login",
    nav: "User Login",
    kicker: "Your Hisab account",
    description: "Sign in to manage your farm income, expenses, and crops.",
    detail:
      "Open your Hisab account to record income and expenses, manage crops, and keep track of your farming activity.",
    points: ["Income", "Expenses", "Crops", "Reports"],
    icon: LogIn,
    tile: "bg-[hsl(215_28%_17%)] text-white",
    wash: "bg-[radial-gradient(120%_80%_at_100%_0%,hsl(215_25%_40%/0.16),transparent_55%)]",
    chip: "bg-[hsl(215_20%_94%)] text-[hsl(215_25%_28%)]",
  },
  {
    href: "https://vadindia.com/farmer",
    shortcut: "3",
    index: "03",
    title: "Farmer",
    nav: "Farmer",
    kicker: "For the farming community",
    description: "Explore VADI Hisab and tools built for farmers.",
    detail: "Discover VADI Hisab, explore its farming tools, and learn how to manage your farm accounts in one place.",
    points: ["Farm tools", "Features", "Get started"],
    icon: Sprout,
    tile: "bg-[hsl(24_70%_94%)] text-[hsl(20_55%_38%)]",
    wash: "bg-[radial-gradient(120%_80%_at_100%_0%,hsl(24_80%_70%/0.28),transparent_55%)]",
    chip: "bg-[hsl(24_70%_94%)] text-[hsl(20_45%_34%)]",
  },
];

// Preserve the source hub markup while adapting Next links to this Vite app.
const Link = forwardRef<HTMLAnchorElement, ComponentProps<"a">>(function Link(props, ref) {
  return <a ref={ref} {...props} />;
});
function Image({ priority: _priority, ...props }: ComponentProps<"img"> & { priority?: boolean }) {
  return <img {...props} />;
}
export default function Home() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const destination = destinations[active];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const hit = destinations.findIndex((item) => item.shortcut === event.key);
      if (hit >= 0) {
        event.preventDefault();
        const href = destinations[hit].href;
        if (href.startsWith("https://")) window.location.assign(href);
        else window.location.assign(href);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => {
          const next =
            event.key === "ArrowDown"
              ? (current + 1) % destinations.length
              : (current - 1 + destinations.length) % destinations.length;
          itemRefs.current[next]?.focus();
          return next;
        });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function spotlight(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--mx",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--my",
      `${event.clientY - rect.top}px`,
    );
  }

  return (
    <div className="hub-page relative flex min-h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_8%_-10%,hsl(20_55%_88%/0.7),transparent_58%),radial-gradient(ellipse_45%_40%_at_100%_10%,hsl(30_40%_92%/0.8),transparent_50%)]"
      />

      <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.82)] backdrop-blur-md">
        <div className="section-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/vadi-hisab-logo-original.png" alt="VADI Hisab" width={1280} height={1280} className="hub-hisab-logo" priority />
            <span>
              <span className="block text-sm font-semibold leading-none tracking-tight">
                VADI Hisab
              </span>
              <span className="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">
                Admin &amp; farmer hub
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {destinations.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                className={`rounded-lg px-2.5 py-2 transition sm:px-3 ${
                  active === index
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {item.nav}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="section-container flex flex-1 flex-col py-10 sm:py-14 lg:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <div className="hub-in">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
              Welcome
            </p>
            <h1 className="mt-3 max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              Where do you need to go?
            </h1>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
              Hover a door, or press{" "}
              <kbd className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 font-sans text-xs font-medium text-[hsl(var(--foreground))]">
                1
              </kbd>
              {" "}
              <kbd className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 font-sans text-xs font-medium text-[hsl(var(--foreground))]">
                2
              </kbd>{" "}
              <kbd className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 font-sans text-xs font-medium text-[hsl(var(--foreground))]">
                3
              </kbd>{" "}
              to open it. Arrow keys move the highlight.
            </p>

            <ul className="mt-8 flex flex-col gap-2">
              {destinations.map((item, index) => {
                const Icon = item.icon;
                const selected = active === index;
                return (
                  <li key={item.href}>
                    <Link
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      href={item.href}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      className={`group flex items-center gap-4 rounded-2xl border px-4 py-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 sm:px-5 ${
                        selected
                          ? "border-[hsl(var(--foreground)/0.14)] bg-[hsl(var(--card))] shadow-[inset_3px_0_0_hsl(var(--primary)),0_16px_40px_-28px_hsl(30_20%_20%/0.45)]"
                          : "border-transparent hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card)/0.7)]"
                      }`}
                    >
                      <span className="w-7 shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                        {item.index}
                      </span>
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-200 ${item.tile} ${
                          selected ? "scale-100" : "scale-95 opacity-80 group-hover:scale-100 group-hover:opacity-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-2">
                          <span className="text-base font-semibold tracking-tight">
                            {item.title}
                          </span>
                          <span className="hidden font-mono text-[11px] text-[hsl(var(--muted-foreground))] sm:inline">
                            {item.kicker}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-[hsl(var(--muted-foreground))]">
                          {item.description}
                        </span>
                      </span>
                      <span
                        className={`hidden h-7 min-w-7 items-center justify-center rounded-md border border-[hsl(var(--border))] font-mono text-xs text-[hsl(var(--muted-foreground))] sm:flex ${
                          selected ? "bg-[hsl(var(--muted))]" : ""
                        }`}
                      >
                        {item.shortcut}
                      </span>
                      <ArrowUpRight
                        className={`h-4 w-4 shrink-0 transition duration-200 ${
                          selected
                            ? "translate-x-0.5 -translate-y-0.5 text-[hsl(var(--foreground))]"
                            : "text-[hsl(var(--muted-foreground))] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hub-in lg:sticky lg:top-24" style={{ animationDelay: "80ms" }}>
            <Link
              href={destination.href}
              onMouseMove={spotlight}
              className={`group relative block overflow-hidden rounded-[1.6rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_30px_70px_-46px_hsl(30_20%_20%/0.55)] sm:p-8 ${destination.wash}`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(380px circle at var(--mx, 70%) var(--my, 20%), hsl(var(--foreground) / 0.06), transparent 42%)",
                }}
              />
              <div key={destination.href} className="hub-swap relative">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${destination.tile}`}
                  >
                    <destination.icon className="h-7 w-7" aria-hidden />
                  </span>
                  <span className="font-mono text-4xl font-medium tracking-tight text-[hsl(var(--foreground)/0.12)]">
                    {destination.index}
                  </span>
                </div>
                <p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {destination.kicker}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {destination.title}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
                  {destination.detail}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {destination.points.map((point) => (
                    <li
                      key={point}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${destination.chip}`}
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[hsl(var(--border))] pt-5">
                  <span className="text-sm font-medium">
                    Open {destination.title}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <HubFooter />
    </div>
  );
}
