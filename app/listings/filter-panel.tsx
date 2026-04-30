import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VEHICLE_TYPES } from "@/lib/listing-taxonomy";

type FilterState = {
  // Hero state — preserved as hidden inputs so hero results survive a filter submit.
  search: string;
  location: string;
  from: string;
  until: string;
  // Filter state — pre-fills the inputs.
  types: string[];
  transmission: string;
  fuels: string[];
  seats: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const TRANSMISSIONS = ["Automatic", "Manual"];
const FUEL_TYPES = ["Gasoline", "Diesel", "Electric", "Hybrid"];
const SEATS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "2", label: "2+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "7", label: "7+" },
];

export function FilterPanel({ state }: { state: FilterState }) {
  const typeSet = new Set(state.types);
  const fuelSet = new Set(state.fuels);
  const filtersActive =
    state.types.length > 0 ||
    state.transmission !== "" ||
    state.fuels.length > 0 ||
    state.seats !== "" ||
    state.minPrice !== "" ||
    state.maxPrice !== "";

  return (
    <form
      action="/listings"
      className="space-y-5 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]"
      method="GET"
    >
      <input name="search" type="hidden" value={state.search} />
      <input name="location" type="hidden" value={state.location} />
      <input name="from" type="hidden" value={state.from} />
      <input name="until" type="hidden" value={state.until} />
      <input name="sort" type="hidden" value={state.sort} />

      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">Filters</h3>
        {filtersActive ? (
          <a
            className="text-xs font-semibold text-primary hover:underline"
            href={(() => {
              const q = new URLSearchParams();
              if (state.search) q.set("search", state.search);
              if (state.location) q.set("location", state.location);
              if (state.from) q.set("from", state.from);
              if (state.until) q.set("until", state.until);
              if (state.sort) q.set("sort", state.sort);
              const qs = q.toString();
              return qs ? `/listings?${qs}` : "/listings";
            })()}
          >
            Clear
          </a>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Price (₱/day)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            defaultValue={state.minPrice}
            min={0}
            name="minPrice"
            placeholder="Min"
            type="number"
          />
          <span className="text-on-surface-variant">–</span>
          <Input
            defaultValue={state.maxPrice}
            min={0}
            name="maxPrice"
            placeholder="Max"
            type="number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Vehicle Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {VEHICLE_TYPES.map((t) => (
            <label
              className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/40 cursor-pointer"
              key={t.slug}
            >
              <input
                className="size-3.5 rounded border-border text-primary focus:ring-primary"
                defaultChecked={typeSet.has(t.slug)}
                name="types"
                type="checkbox"
                value={t.slug}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Transmission
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/40 cursor-pointer">
            <input
              className="size-3.5 border-border text-primary focus:ring-primary"
              defaultChecked={state.transmission === ""}
              name="transmission"
              type="radio"
              value=""
            />
            <span>Any</span>
          </label>
          {TRANSMISSIONS.map((t) => (
            <label
              className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/40 cursor-pointer"
              key={t}
            >
              <input
                className="size-3.5 border-border text-primary focus:ring-primary"
                defaultChecked={state.transmission === t}
                name="transmission"
                type="radio"
                value={t}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Fuel Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {FUEL_TYPES.map((f) => (
            <label
              className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/40 cursor-pointer"
              key={f}
            >
              <input
                className="size-3.5 rounded border-border text-primary focus:ring-primary"
                defaultChecked={fuelSet.has(f)}
                name="fuels"
                type="checkbox"
                value={f}
              />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Seats
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {SEATS_OPTIONS.map((s) => (
            <label
              className="flex items-center justify-center gap-1 rounded-md border border-border p-1.5 text-xs hover:bg-muted/40 cursor-pointer"
              key={s.value || "any"}
            >
              <input
                className="size-3 border-border text-primary focus:ring-primary"
                defaultChecked={state.seats === s.value}
                name="seats"
                type="radio"
                value={s.value}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button className="w-full" type="submit">
        Apply filters
      </Button>
    </form>
  );
}
