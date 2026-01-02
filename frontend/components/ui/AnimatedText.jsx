import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AnimatedText = ({
  children,
  className = '',
  scrollContainerRef,
  scrollStart = 'top bottom-=100px',
  scrollEnd = 'bottom top+=100px',
  ease = 'power2.out',
  yOffset = 30,
  duration = 0.8,
  delay = 0
}) => {
  const textRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // Set initial state
    gsap.set(text, { y: yOffset, opacity: 0 });

    // Create animation
    const animation = gsap.to(text, {
      y: 0,
      opacity: 1,
      duration: duration,
      delay: delay,
      ease: ease,
      scrollTrigger: {
        trigger: text,
        scroller,
        start: scrollStart,
        end: scrollEnd,
        toggleActions: 'play none none reverse'
      }
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === text) {
          trigger.kill();
        }
      });
    };
  }, [scrollContainerRef, scrollStart, scrollEnd, ease, yOffset, duration, delay]);

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedText;

