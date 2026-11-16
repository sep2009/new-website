"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { CalendarDays, Loader2, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/memories/format";
import type { MapMemory } from "@/lib/memories/queries";

type Place = {
  key: string;
  name: string;
  lat: number;
  lng: number;
  items: MapMemory[];
};

type Props = {
  memories: MapMemory[];
  /** Sample-data preview: no lookups, links stay inside the demo. */
  demo?: boolean;
  loadError?: boolean;
};

const STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`),
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
      maxzoom: 19,
    },
  },
  layers: [
    { id: "bg", type: "background" as const, paint: { "background-color": "#0a0828" } },
    { id: "carto", type: "raster" as const, source: "carto" },
  ],
};

const MARKER_BASE =
  "flex items-center justify-center rounded-full border-2 border-white/90 bg-linear-to-br from-[#7d52ff] to-[#c04fd6] " +
  "font-semibold text-white shadow-[0_0_0_6px_rgba(148,101,255,0.25),0_8px_20px_rgba(0,0,0,0.5)] " +
  "transition-transform duration-200 cursor-pointer";

export function MemoryMap({ memories, demo, loadError }: Props) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<Map<string, { marker: import("maplibre-gl").Marker; el: HTMLButtonElement }>>(new Map());
  const [ready, setReady] = useState(false);
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [lookupMsg, setLookupMsg] = useState("");
  const [failed, setFailed] = useState<string[]>([]);
  const [mapError, setMapError] = useState("");

  const years = useMemo(
    () => [...new Set(memories.map((m) => m.memory_date.slice(0, 4)))].sort((a, b) => Number(b) - Number(a)),
    [memories],
  );

  const places: Place[] = useMemo(() => {
    const groups = new Map<string, Place>();
    for (const m of memories) {
      if (m.latitude == null || m.longitude == null) continue;
      if (year && !m.memory_date.startsWith(year)) continue;
      const key = `${m.latitude.toFixed(2)},${m.longitude.toFixed(2)}`;
      const g = groups.get(key);
      if (g) g.items.push(m);
      else
        groups.set(key, {
          key,
          name: m.location_name ?? "Unnamed place",
          lat: m.latitude,
          lng: m.longitude,
          items: [m],
        });
    }
    return [...groups.values()].sort((a, b) => b.items.length - a.items.length);
  }, [memories, year]);

  const unlocated = memories.filter(
    (m) => m.location_name && (m.latitude == null || m.longitude == null) && !failed.includes(m.location_name.trim()),
  ).length;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !container.current) return;
        // The worker is served from /public (see scripts/copy-maplibre-worker.mjs).
        maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
        const map = new maplibre.Map({
          container: container.current,
          style: STYLE,
          center: [10, 25],
          zoom: 1.4,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        mapRef.current = map;
        map.on("load", () => !cancelled && setReady(true));
        map.on("error", (e: { error?: { message?: string } }) => {
          if (!cancelled && /tile|fetch|network/i.test(String(e.error?.message ?? ""))) {
            setMapError("Map tiles couldn't load. Check your connection.");
          }
        });
      } catch {
        if (!cancelled) setMapError("The map couldn't start in this browser.");
      }
    })();
    const live = markers.current;
    return () => {
      cancelled = true;
      live.forEach(({ marker }) => marker.remove());
      live.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw markers for the places currently shown.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current.clear();

      for (const p of places) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `${p.name}, ${p.items.length} ${p.items.length === 1 ? "memory" : "memories"}`);
        el.className = cn(MARKER_BASE, p.items.length > 1 ? "size-10 text-sm" : "size-6");
        el.textContent = p.items.length > 1 ? String(p.items.length) : "";
        el.addEventListener("click", () => setSelected(p.key));
        const marker = new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
        markers.current.set(p.key, { marker, el });
      }

      if (places.length === 1) {
        map.flyTo({ center: [places[0].lng, places[0].lat], zoom: 5, duration: 700 });
      } else if (places.length > 1) {
        const b = new maplibre.LngLatBounds();
        places.forEach((p) => b.extend([p.lng, p.lat]));
        map.fitBounds(b, { padding: 70, maxZoom: 6, duration: 700 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [places, ready]);

  // Highlight the selected marker.
  useEffect(() => {
    markers.current.forEach(({ el }, key) => {
      el.style.transform = key === selected ? "scale(1.25)" : "";
      el.style.zIndex = key === selected ? "5" : "";
    });
  }, [selected, places, ready]);

  function focusPlace(p: Place) {
    setSelected(p.key);
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: Math.max(mapRef.current.getZoom(), 5), duration: 700 });
  }

  const current = places.find((p) => p.key === selected) ?? null;

  async function locatePlaces() {
    setLocating(true);
    setLookupMsg("");
    const skip = [...failed];
    let located = 0;
    try {
      for (let i = 0; i < 20; i++) {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skip }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Lookup failed.");
        located += body.located ?? 0;
        (body.notFound ?? []).forEach((n: string) => skip.push(n));
        if (!body.remaining) break;
      }
      setFailed(skip);
      const missed = skip.length - failed.length;
      setLookupMsg(
        located > 0
          ? `Placed ${located} ${located === 1 ? "memory" : "memories"} on the map.${missed ? ` Couldn't find ${missed} ${missed === 1 ? "place" : "places"}: try a more specific name like "Paris, France".` : ""}`
          : missed
            ? `Couldn't find ${missed} ${missed === 1 ? "place" : "places"}. Try a more specific name like "Paris, France".`
            : "Nothing new to place.",
      );
      router.refresh();
    } catch (e) {
      setLookupMsg(e instanceof Error ? e.message : "Lookup failed. Please try again.");
    } finally {
      setLocating(false);
    }
  }

  const hasAnyPlace = memories.length > 0;
  const href = (id: string) => (demo ? "/demo" : `/memories/${id}`);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center rounded-full border px-5 text-sm transition duration-300 ease-calm",
      active
        ? "border-transparent bg-linear-to-r from-[#5a3df0] to-[#7d52ff] text-white shadow-brand"
        : "border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg",
    );

  return (
    <div className="flex flex-col gap-5">
      {loadError && (
        <Notice tone="error">We couldn&apos;t load your places just now. Please refresh in a moment.</Notice>
      )}

      {!demo && unlocated > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-accent-2/30 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.95rem] font-medium">
              {unlocated} {unlocated === 1 ? "memory has" : "memories have"} a place name but no spot on the map yet.
            </p>
            <p className="type-caption mt-1 text-fg-subtle">
              Finding them sends only the place names (nothing else) to OpenStreetMap&apos;s search. Positions are saved
              privately on your memories.
            </p>
          </div>
          <button
            type="button"
            onClick={locatePlaces}
            disabled={locating}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-white shadow-brand transition hover:brightness-110 disabled:opacity-60"
          >
            {locating && <Loader2 className="size-4 animate-spin" />}
            {locating ? "Finding places…" : "Find them on the map"}
          </button>
        </div>
      )}
      {lookupMsg && <Notice tone="success">{lookupMsg}</Notice>}

      {years.length > 1 && (
        <nav aria-label="Filter by year" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex gap-2">
            <li>
              <button type="button" className={chip(!year)} onClick={() => setYear("")} aria-pressed={!year}>
                All years
              </button>
            </li>
            {years.map((y) => (
              <li key={y}>
                <button type="button" className={chip(year === y)} onClick={() => setYear(y)} aria-pressed={year === y}>
                  {y}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface shadow-lift">
          <div ref={container} className="h-[58dvh] min-h-[24rem] w-full lg:h-[68dvh]" aria-label="Map of your memories" />
          {!ready && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
              <Loader2 className="size-6 animate-spin text-accent-2" />
            </div>
          )}
          {mapError && (
            <div className="absolute inset-x-4 top-4">
              <Notice tone="error">{mapError}</Notice>
            </div>
          )}
          {ready && places.length === 0 && (
            <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl border border-line bg-base/80 p-4 text-center backdrop-blur-md">
              <p className="type-small text-fg-muted">
                {hasAnyPlace
                  ? year
                    ? `No placed memories in ${year}.`
                    : "Your places will appear here once they're found on the map."
                  : "No places yet."}
              </p>
            </div>
          )}
        </div>

        <aside aria-label="Places" className="flex max-h-[68dvh] min-h-48 flex-col rounded-[2rem] border border-line bg-surface/50 p-5">
          {current ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="type-heading flex items-center gap-2">
                    <MapPin className="size-5 shrink-0 text-accent-2" />
                    <span className="truncate">{current.name}</span>
                  </h2>
                  <p className="type-caption mt-1 text-fg-subtle">
                    {current.items.length} {current.items.length === 1 ? "memory" : "memories"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Back to all places"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
                {current.items.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={href(m.id)}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-base/40 p-2.5 transition hover:border-line-strong hover:bg-surface-2/60"
                    >
                      <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                        {m.cover_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.cover_url} alt="" loading="lazy" className="size-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.title}</span>
                        <span className="type-caption flex items-center gap-1.5 text-fg-subtle">
                          <CalendarDays className="size-3" /> {formatDate(m.memory_date)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="type-heading mb-1">Places</h2>
              <p className="type-caption mb-4 text-fg-subtle">Choose a place to see its memories.</p>
              {places.length === 0 ? (
                <div className="flex flex-1 flex-col items-start justify-center gap-3">
                  <p className="type-small text-fg-muted">
                    {hasAnyPlace
                      ? "Nothing to show for this filter."
                      : "Add a place to a memory and it will appear on your map. Location is always optional and private."}
                  </p>
                  {!hasAnyPlace && !demo && (
                    <ButtonLink href="/memories/new" size="sm">
                      Create a Memory
                    </ButtonLink>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
                  {places.map((p) => (
                    <li key={p.key}>
                      <button
                        type="button"
                        onClick={() => focusPlace(p)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-base/40 px-4 py-3 text-left transition hover:border-line-strong hover:bg-surface-2/60"
                      >
                        <MapPin className="size-4 shrink-0 text-accent-2" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs text-accent-3">
                          {p.items.length}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
