import React from 'react';

export function useContainerWidth(ref, minWidth = 1) {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth(Math.max(minWidth, Math.floor(w)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, minWidth]);

  return width;
}
