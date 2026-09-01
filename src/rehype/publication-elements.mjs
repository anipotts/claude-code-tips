const element = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });

function transformChildren(parent) {
  if (!Array.isArray(parent?.children)) return;
  const next = [];

  for (const child of parent.children) {
    transformChildren(child);

    if (child?.type === 'element' && child.tagName === 'table') {
      child.properties = {
        ...(child.properties ?? {}),
        tabindex: 0,
        'aria-label': 'scrollable comparison table',
      };
      next.push(element('div', {
        className: ['publication-scroll-area', 'relative', 'overflow-hidden'],
        'data-sw-scroll-area': '',
        'data-slot': 'scroll-area',
      }, [
        element('div', {
          className: ['publication-scroll-viewport', 'size-full', 'overflow-auto', 'rounded-[inherit]', 'outline-none'],
          'data-sw-scroll-area-viewport': '',
          'data-slot': 'scroll-area-viewport',
          role: 'presentation',
          tabindex: -1,
        }, [
          element('div', {
            className: ['min-w-fit'],
            'data-sw-scroll-area-content': '',
            'data-slot': 'scroll-area-content',
            role: 'presentation',
          }, [child]),
        ]),
        element('div', {
          className: ['publication-scrollbar'],
          'data-sw-scroll-area-scrollbar': '',
          'data-slot': 'scroll-area-scrollbar',
          'data-orientation': 'horizontal',
        }, [element('div', {
          className: ['publication-scroll-thumb'],
          'data-sw-scroll-area-thumb': '',
          'data-slot': 'scroll-area-thumb',
        })]),
        element('div', {
          'data-sw-scroll-area-corner': '',
          'data-slot': 'scroll-area-corner',
          'aria-hidden': 'true',
        }),
      ]));
      continue;
    }

    if (child?.type === 'element' && child.tagName === 'pre') {
      next.push(element('div', {
        className: ['code-frame'],
        'data-sw-tooltip': '',
        'data-close-delay': '120',
        'data-close-on-escape': 'true',
        'data-close-on-outside-interact': 'true',
        'data-content-hoverable': 'false',
        'data-open-delay': '180',
        'data-state': 'closed',
      }, [
        element('button', {
          type: 'button',
          className: [
            'code-copy', 'inline-flex', 'items-center', 'justify-center', 'gap-1.5', 'rounded-md',
            'font-medium', 'whitespace-nowrap', 'transition-all', 'outline-none', 'focus-visible:ring-3',
            'bg-foreground', 'text-background', 'hover:bg-foreground/90', 'focus-visible:ring-outline/50',
            'h-9', 'px-4', 'text-sm',
          ],
          'data-code-copy': '',
          'data-slot': 'button',
          'data-sw-tooltip-trigger': '',
          'data-state': 'closed',
          'aria-label': 'copy code',
        }, [{ type: 'text', value: 'copy' }]),
        child,
        element('span', {
          'data-sw-tooltip-portal': '',
          'data-sw-portal-placement': 'runtime',
          'data-placement': 'pending',
        }, [element('span', {
          className: ['z-50'],
          'data-sw-tooltip-positioner': '',
          'data-state': 'closed',
          'data-side': 'top',
          'data-align': 'center',
          'data-side-offset': '8',
          'data-avoid-collisions': 'true',
        }, [element('span', {
          className: [
            'code-copy-tooltip', 'group', 'hidden', 'w-fit', 'px-3', 'py-1.5', 'bg-foreground',
            'text-background', 'rounded-md', 'animate-in', 'fade-in', 'zoom-in-95', 'duration-150',
            'origin-(--transform-origin)',
          ],
          'data-sw-tooltip-popup': '',
          'data-state': 'closed',
          'data-side': 'top',
          'data-align': 'center',
          'data-side-offset': '8',
          'data-avoid-collisions': 'true',
          role: 'tooltip',
          hidden: true,
        }, [{ type: 'text', value: 'copy code' }])])]),
      ]));
      continue;
    }

    next.push(child);
  }

  parent.children = next;
}

export default function publicationElements() {
  return (tree) => transformChildren(tree);
}
