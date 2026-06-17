import React, { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const DEFAULT_TOOLTIP_Z_INDEX = 9999;

const setRef = (ref, value) => {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
};

const Tooltip = ({ children, content, placement = 'top', zIndex }) => {
  const childRef = useRef(null);
  const originalRef = children.ref;

  useEffect(() => {
    if (childRef.current) {
      const finalContent = React.isValidElement(content)
        ? renderToStaticMarkup(content)
        : content;

      const instance = tippy(childRef.current, {
        content: finalContent,
        theme: 'light',
        placement,
        allowHTML: true,
        zIndex: zIndex || DEFAULT_TOOLTIP_Z_INDEX,
        appendTo: () => document.body,
        onCreate: (instance) => {
          const content = instance.popper.querySelector('.tippy-content');
          if (content) {
            content.style.textAlign = 'center';
          }
        },
      });

      return () => {
        if (Array.isArray(instance)) {
          instance.forEach(tip => tip.destroy());
        } else if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      };
    }
  }, [content, placement, zIndex]);

  return React.cloneElement(children, {
    ref: (node) => {
      childRef.current = node;
      setRef(originalRef, node);
    },
  });
};

export default Tooltip;
