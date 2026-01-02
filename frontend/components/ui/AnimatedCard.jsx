import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AnimatedCard = ({
  children,
  className = '',
  delay = 0,
  scrollContainerRef,
  scrollStart = 'top bottom-=100px',
  scrollEnd = 'bottom top+=100px',
  ease = 'power3.out'
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    gsap.set(card, { y: 50, opacity: 0 });

    const animation = gsap.to(card, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      delay: delay,
      ease: ease,
      scrollTrigger: {
        trigger: card,
        scroller,
        start: scrollStart,
        end: scrollEnd,
        toggleActions: 'play none none reverse'
      }
    });

    return () => {
      animation.kill();
    };
  }, [delay, scrollContainerRef, scrollStart, scrollEnd, ease]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedCard;

