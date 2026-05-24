"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getBrandSettings,
  saveBrandSettings,
  type BrandSettings,
} from "@/lib/brand";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>(() =>
    getBrandSettings()
  );
  const [savedMessage, setSavedMessage] = useState("");

  function updateField<K extends keyof BrandSettings>(
    key: K,
    value: BrandSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        updateField("logoDataUrl", result);
      }
    };

    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    updateField("logoDataUrl", "");
  }

  function handleSave() {
    saveBrandSettings(settings);
    setSavedMessage("Brand settings saved successfully.");

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Brand Settings</h2>
        <p className="mt-2 text-gray-600">
          Manage the identity shown in printable reports and branded views.
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            App Name
          </label>
          <input
            value={settings.appName}
            onChange={(e) => updateField("appName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Tagline
          </label>
          <input
            value={settings.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Business Name
          </label>
          <input
            value={settings.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Contact Email
          </label>
          <input
            value={settings.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Contact Phone
          </label>
          <input
            value={settings.contactPhone}
            onChange={(e) => updateField("contactPhone", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Website
          </label>
          <input
            value={settings.website}
            onChange={(e) => updateField("website", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Address
          </label>
          <input
            value={settings.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Logo Text / Initials
          </label>
          <input
            value={settings.logoText}
            onChange={(e) =>
              updateField("logoText", e.target.value.toUpperCase())
            }
            maxLength={4}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="e.g. NT"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => updateField("accentColor", e.target.value)}
              className="h-12 w-16 rounded border border-gray-300 bg-white"
            />
            <input
              value={settings.accentColor}
              onChange={(e) => updateField("accentColor", e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 p-3 text-black"
              placeholder="#111111"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Logo Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block w-full text-black"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {settings.logoDataUrl ? (
              <>
                <Image
                  src={settings.logoDataUrl}
                  alt="Brand logo preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-xl border border-gray-200 object-cover bg-white"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  Remove Logo
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                No logo image uploaded. The report will use logo initials.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-medium text-black">Preview</p>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {settings.logoDataUrl ? (
            <Image
              src={settings.logoDataUrl}
              alt="Brand logo"
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-2xl border border-gray-200 object-cover bg-white"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white"
              style={{ backgroundColor: settings.accentColor }}
            >
              {settings.logoText || "NT"}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              {settings.appName}
            </p>
            <p className="mt-1 text-xl font-bold text-black">
              {settings.businessName}
            </p>
            <p className="text-sm text-gray-600">{settings.tagline}</p>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90"
        >
          Save Brand Settings
        </button>
      </div>
    </section>
  );
}
