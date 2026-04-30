"use client";

import { useRouter, useSearchParams } from "next/navigation";

type SortOption = { slug: string; label: string };

export function SortDropdown({
  value,
  options,
}: {
  value: string;
  options: SortOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    router.push(`/listings?${next.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
      <span className="font-semibold">Sort:</span>
      <select
        className="rounded-md border border-border bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        onChange={onChange}
        value={value}
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
