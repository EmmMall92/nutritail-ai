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
  tagline: "Ενημερωτική επιλογή τροφής κατοικιδίων",
  businessName: "Nutritail AI",
  contactEmail: "info@nutritail.ai",
  contactPhone: "",
  website: "https://nutritail.ai",
  address: "",
  logoText: "NT",
  accentColor: "#1f7a4d",
  logoDataUrl: "",

  name: "Nutritail AI",
  shortName: "Nutritail",
  slogan: "Ενημερωτική επιλογή τροφής κατοικιδίων",
  description: "Ενημερωτική επιλογή τροφής για σκύλους και γάτες.",
  domain: "https://nutritail.ai",
  colors: {
    primary: "#123d2b",
    secondary: "#eaf7ef",
    accent: "#1f7a4d",
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
