import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './AnimatedList.module.css';

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      style={{ marginBottom: '1rem' }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = [
    'Item 1',
    'Item 2',
    'Item 3',
    'Item 4',
    'Item 5',
    'Item 6',
    'Item 7',
    'Item 8',
    'Item 9',
    'Item 10',
    'Item 11',
    'Item 12',
    'Item 13',
    'Item 14',
    'Item 15'
  ],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  renderItem = null
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleItemMouseEnter = useCallback(index => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item, index) => {
      setSelectedIndex(index);
      // Only call onItemSelect if no custom renderItem is provided
      // Custom renderItem components handle their own clicks
      if (onItemSelect && !renderItem) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect, renderItem]
  );

  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`${styles.scrollListContainer} ${className}`}>
      <div ref={listRef} className={`${styles.scrollList} ${!displayScrollbar ? styles.noScrollbar : ''}`} onScroll={handleScroll}>
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={index * 0.15}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={renderItem ? undefined : () => handleItemClick(item, index)}
          >
            {renderItem ? (
              renderItem(item, index, selectedIndex === index)
            ) : (
              <div 
                className={`${styles.item} ${selectedIndex === index ? styles.itemSelected : ''} ${itemClassName}`}
                onClick={() => handleItemClick(item, index)}
                style={{ cursor: 'pointer' }}
              >
                <p className={styles.itemText}>{typeof item === 'string' ? item : item.question || item.text || JSON.stringify(item)}</p>
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className={styles.topGradient} style={{ opacity: topGradientOpacity }}></div>
          <div className={styles.bottomGradient} style={{ opacity: bottomGradientOpacity }}></div>
        </>
      )}
    </div>
  );
};

export default AnimatedList;

