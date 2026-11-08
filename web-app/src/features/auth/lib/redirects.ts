type AuthRedirectResult = { url: string } | { error: string };

export const getAuthRedirectUrl = (
  callbackPath: string,
  nextPath: string,
): AuthRedirectResult => {
  // SITE_URL is read at runtime; NEXT_PUBLIC_SITE_URL remains a fallback for
  // existing deployments where Next.js embeds public variables at build time.
  const configuredUrl =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return {
      error: "Email confirmation links are not configured. Please contact an administrator.",
    };
  }

  try {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
      configuredUrl,
    );
    const absoluteUrl = configuredUrl.includes("://")
      ? configuredUrl
      : `${isLocal ? "http" : "https"}://${configuredUrl}`;
    const siteUrl = new URL(absoluteUrl);

    if (
      !["https:", "http:"].includes(siteUrl.protocol) ||
      siteUrl.username ||
      siteUrl.password ||
      siteUrl.pathname !== "/" ||
      siteUrl.search ||
      siteUrl.hash
    ) {
      throw new Error("Invalid site origin");
    }

    const callbackUrl = new URL(callbackPath, siteUrl.origin);
    callbackUrl.searchParams.set("next", nextPath);
    return { url: callbackUrl.toString() };
  } catch {
    return {
      error: "Email confirmation links are not configured correctly. Please contact an administrator.",
    };
  }
};

export const getSafeRedirectPath = (
  value: string | null,
  fallback: string,
): string => {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://app.invalid");
    const nextUrl = new URL(value, baseUrl);
    if (
      nextUrl.origin !== baseUrl.origin ||
      nextUrl.pathname.startsWith("//")
    ) {
      return fallback;
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch {
    return fallback;
  }
};
