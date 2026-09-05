import type { AnchorHTMLAttributes } from 'react';

/**
 * A deliberately small internal link primitive.
 *
 * The Vercel build currently uses Vinext's compatibility runtime. Its
 * client-side `next/link` prefetcher can fail during hydration, which leaves
 * navigation clicks stuck on the current route. A normal anchor keeps the
 * same accessible link semantics and lets the server render the destination
 * reliably while that runtime is in use.
 */
export default function SafeLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
