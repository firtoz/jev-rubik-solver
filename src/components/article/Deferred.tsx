import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

export function NearViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="deferred-replay">
      <Suspense fallback={<p>Loading recorded replay…</p>}>
        {ready ? children : <p>Recorded comparison</p>}
      </Suspense>
    </div>
  );
}

export function LazyDetails({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <details
      id={id}
      onToggle={(e) => {
        if (e.currentTarget.open) setLoaded(true);
      }}
    >
      <summary>{title}</summary>
      {loaded && <Suspense fallback={<p>Loading evidence…</p>}>{children}</Suspense>}
    </details>
  );
}
