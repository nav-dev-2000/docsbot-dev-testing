import React, { useEffect, useRef } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const Tooltip = ({ children, content, placement = 'top' }) => {
  const childRef = useRef(null);

  useEffect(() => {
    if (childRef.current) {
      const instance = tippy(childRef.current, {
        content,
        theme: 'light',
        placement,
        allowHTML: true,
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
  }, [content, placement]);

  return React.cloneElement(children, { ref: childRef });
};

export default Tooltip;