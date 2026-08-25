import { Header } from "./Header";
import { Page } from "./Chrome";
import { CardSkeleton, IndexingBanner } from "./States";

/** Suspense fallback for lazily loaded routes. Reserves card space to avoid layout shift. */
export function RouteLoading() {
  return (
    <Page minHeight>
      <Header descriptor="Resolving archive node" />
      <main id="main" style={{ padding: "clamp(36px,5vw,52px) clamp(20px,3vw,40px) 48px" }}>
        <IndexingBanner detail="Resolving archive index · verifying clearance" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CardSkeleton key={i} index={i} />
          ))}
        </div>
      </main>
    </Page>
  );
}
