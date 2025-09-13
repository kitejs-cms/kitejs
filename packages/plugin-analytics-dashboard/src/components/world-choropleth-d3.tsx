import { useEffect, useMemo, useRef, useState } from "react";
import {
  geoNaturalEarth1,
  geoPath,
  geoGraticule10,
  type GeoProjection,
} from "d3-geo";
import type {
  Feature as GeoFeature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { feature as topoToGeo } from "topojson-client";
import { scaleLinear } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { extent } from "d3-array";
import { format } from "d3-format";

/* JSON Data */
import isoMap from "../geo-data/iso-map.json";
import countriesData from "../geo-data/countries-110m.json";

type IsoRow = {
  name: string;
  alpha3: string;
  countryCode: string;
};

type CountryProps = { name: string };

type WorldAtlas = {
  type: "Topology";
  objects: {
    countries: {
      type: "GeometryCollection";
      geometries: Array<{
        id: string | number;
        properties: CountryProps;
        type: string;
        arcs: unknown;
      }>;
    };
  };
  arcs: unknown;
  transform?: unknown;
};

type Props = {
  data: Record<string, number>;
  height?: number;
};

type CountryFeature = GeoFeature<Polygon | MultiPolygon, CountryProps>;

type TooltipState = {
  x: number;
  y: number;
  name: string;
  iso: string;
  value: number | null;
  show: boolean;
};

const numericToAlpha3: Record<string, string> = (isoMap as IsoRow[]).reduce(
  (acc, row) => {
    acc[row.countryCode] = row.alpha3.toUpperCase();
    return acc;
  },
  {} as Record<string, string>
);

export function WorldChoroplethD3({ data, height = 520 }: Props) {
  const geos: CountryFeature[] = useMemo(() => {
    const topo = countriesData as unknown as WorldAtlas;
    const fc = topoToGeo(
      topo as never,
      topo.objects.countries as never
    ) as unknown as FeatureCollection<Polygon | MultiPolygon, CountryProps>;
    return fc.features as CountryFeature[];
  }, []);

  const [vmin, vmax] = useMemo(() => {
    const nums = Object.values(data).filter((v): v is number =>
      Number.isFinite(v)
    );
    const [lo, hi] = (extent(nums) as [
      number | undefined,
      number | undefined,
    ]) ?? [0, 1];
    const a = lo ?? 0;
    const b = hi ?? a + 1;
    return a === b ? ([a, a + 1] as const) : ([a, b] as const);
  }, [data]);

  const color = useMemo(() => {
    const t = scaleLinear<number, number>()
      .domain([vmin, vmax])
      .range([0.2, 0.95])
      .clamp(true);
    return (v: number | null | undefined) =>
      v == null ? "#F2F8FF" : interpolateBlues(t(v));
  }, [vmin, vmax]);

  const fmt = useMemo(() => format(",.0f"), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(1100);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().fitSize([width, height], { type: "Sphere" }),
    [width, height]
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);

  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0,
    y: 0,
    name: "",
    iso: "",
    value: null,
    show: false,
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="World map"
        className="rounded-2xl"
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id="sphereClip">
            <path d={path({ type: "Sphere" }) ?? undefined} />
          </clipPath>
        </defs>

        {/* bordo sfera */}
        <path
          d={path({ type: "Sphere" }) ?? undefined}
          fill="white"
          stroke="#E5EDF6"
          strokeWidth={1}
        />

        <g clipPath="url(#sphereClip)">
          {/* grid */}
          <path
            d={path(graticule) ?? undefined}
            fill="none"
            stroke="#E9EFF6"
            strokeWidth={0.8}
          />

          {/* country */}
          {geos
            .filter((g) => g.properties?.name !== "Antarctica")
            .map((geo, i) => {
              const name = geo.properties?.name ?? "";
              const numeric = String(geo.id);
              const iso3 = numericToAlpha3[numeric] ?? "";
              const value = iso3 ? data[iso3] : null;

              return (
                <path
                  key={i}
                  d={path(geo) ?? undefined}
                  fill={color(value)}
                  stroke="#ffffff"
                  strokeWidth={0.6}
                  onMouseMove={(e) =>
                    setTooltip({
                      show: true,
                      x: e.clientX + 12,
                      y: e.clientY + 12,
                      name,
                      iso: iso3,
                      value: value ?? null,
                    })
                  }
                  onMouseLeave={() =>
                    setTooltip((t) => ({ ...t, show: false }))
                  }
                  style={{ cursor: "default" }}
                />
              );
            })}
        </g>

        {/* bordo sopra i paesi */}
        <path
          d={path({ type: "Sphere" }) ?? undefined}
          fill="none"
          stroke="#E5EDF6"
          strokeWidth={1.2}
        />
      </svg>

      {tooltip.show && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-black/5 bg-white/95 px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">
            {tooltip.name} {tooltip.iso && `(${tooltip.iso})`}
          </div>
          <div className="text-gray-600">
            {tooltip.value == null ? "Nessun dato" : fmt(tooltip.value)}
          </div>
        </div>
      )}
    </div>
  );
}
