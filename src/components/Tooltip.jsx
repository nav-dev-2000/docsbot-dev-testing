import React, { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const Tooltip = ({ children, content, placement = 'top', zIndex }) => {
  const childRef = useRef(null);

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
        zIndex: zIndex || 9999,
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

  return React.cloneElement(children, { ref: childRef });
};

export default Tooltip;