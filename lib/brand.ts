export type BrandSettings = {
  appName: string;
  tagline: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  logoText: string;
  accentColor: string;
  logoDataUrl: string;

  // SEO / newer brand fields
  name: string;
  shortName: string;
  slogan: string;
  description: string;
  domain: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

export const defaultBrandSettings: BrandSettings = {
  appName: "Nutritail AI",
  tagline: "Personalized Pet Nutrition",
  businessName: "Nutritail AI",
  contactEmail: "info@nutritail.ai",
  contactPhone: "",
  website: "https://nutritail.ai",
  address: "",
  logoText: "NT",
  accentColor: "#22c55e",
  logoDataUrl: "",

  name: "Nutritail AI",
  shortName: "Nutritail",
  slogan: "Personalized Pet Nutrition",
  description: "AI-powered pet nutrition guidance for dogs and cats.",
  domain: "https://nutritail.ai",
  colors: {
    primary: "#111111",
    secondary: "#f3f4f6",
    accent: "#22c55e",
  },
};

export const brand = defaultBrandSettings;
export const brandConfig = defaultBrandSettings;

export function getBrandSettings(): BrandSettings {
  return defaultBrandSettings;
}

export function saveBrandSettings(
  settings: Partial<BrandSettings>
): BrandSettings {
  Object.assign(defaultBrandSettings, {
    ...defaultBrandSettings,
    ...settings,
    colors: {
      ...defaultBrandSettings.colors,
      ...(settings.colors ?? {}),
    },
  });

  return defaultBrandSettings;
}