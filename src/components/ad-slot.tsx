// Sponsor script mount was removed intentionally.
//
// The previous provider (smooth-survey.com) was flagged by Google Safe
// Browsing as serving "harmful downloads", which caused Chrome to warn on
// aniora.qzz.io and blocked Search Console sitemap submission.
//
// Kept as an empty no-op export so any lingering imports don't break the
// build. Do NOT re-add third-party ad/sponsor scripts without vetting them
// against Safe Browsing first.
export function SocialBarMount() {
  return null;
}
