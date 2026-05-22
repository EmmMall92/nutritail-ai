"use client";

import { useEffect, useState } from "react";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";

type Props = {
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export default function BrandHeader({
  title,
  subtitle,
  compact = false,
}: Props) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);

  useEffect(() => {
    setBrandSettings(getBrandSettings());
  }, []);

  if (!brandSettings) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {brandSettings.logoDataUrl ? (
            <img
              src={brandSettings.logoDataUrl}
              alt={`${brandSettings.appName} logo`}
              className="h-14 w-14 rounded-2xl border border-gray-200 object-cover bg-white"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white"
              style={{ backgroundColor: brandSettings.accentColor }}
            >
              {brandSettings.logoText || "NT"}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              {brandSettings.appName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-black">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>

        <div className="text-sm text-gray-600 md:text-right">
          <p className="font-semibold text-black">{brandSettings.businessName}</p>
          <p>{brandSettings.website}</p>
        </div>
      </div>
    </div>
  );
}