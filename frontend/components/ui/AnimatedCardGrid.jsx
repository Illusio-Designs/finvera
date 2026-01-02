import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AnimatedCardGrid = ({
  children,
  className = '',
  stagger = 0.08,
  scrollContainerRef,
  scrollStart = 'top bottom-=100px',
  scrollEnd = 'bottom top+=100px',
  ease = 'power3.out',
  yOffset = 50,
  duration = 0.6
}) => {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = Array.from(container.children);
    if (cards.length === 0) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // Store refs
    cardsRef.current = cards;

    // Set initial state
    gsap.set(cards, { y: yOffset, opacity: 0 });

    // Create animation
    const animation = gsap.to(cards, {
      y: 0,
      opacity: 1,
      duration: duration,
      ease: ease,
      stagger: stagger,
      scrollTrigger: {
        trigger: container,
        scroller,
        start: scrollStart,
        end: scrollEnd,
        toggleActions: 'play none none reverse'
      }
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, [stagger, scrollContainerRef, scrollStart, scrollEnd, ease, yOffset, duration]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedCardGrid;

