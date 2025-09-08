import { useEffect, useRef } from "react";
import './slider.css';

function Slider({ children }) {
  const wrapperRef = useRef(null);
  const carouselRef = useRef(null);
  const timeoutIdRef = useRef(null);

  function initSlider() {
    const TIMEOUT = 3000;
    const wrapper = wrapperRef.current;
    const carousel = carouselRef.current;

    if (!wrapper || !carousel) {
      console.warn('Slider: Missing wrapper or carousel');
      return false;
    }

    const firstCard = carousel.querySelector('.slide-item');
    if (!firstCard) {
      console.warn('Slider: Missing .slide-item');
      return false;
    }

    const SCROLL_WIDTH = firstCard.offsetWidth + 16;

    function dragEvent() {
      let isDragging = false;
      let startX = 0;
      let startScrollLeft = 0;

      const dragStart = (e) => {
        isDragging = true;
        carousel.classList.add('dragging');
        startX = e.pageX;
        startScrollLeft = carousel.scrollLeft;
      };
      const dragging = (e) => {
        if (!isDragging) return;
        carousel.scrollLeft = startScrollLeft - (e.pageX - startX);
      };
      const dragStop = () => {
        isDragging = false;
        carousel.classList.remove('dragging');
      };

      carousel.addEventListener('mousedown', dragStart);
      carousel.addEventListener('mousemove', dragging);
      document.addEventListener('mouseup', dragStop);

      return () => {
        carousel.removeEventListener('mousedown', dragStart);
        carousel.removeEventListener('mousemove', dragging);
        document.removeEventListener('mouseup', dragStop);
      };
    }

    function arrowEvent() {
      const arrows = wrapper.querySelectorAll('.caret');
      const handlers = [];

      arrows.forEach((btn) => {
        const handler = () => {
          if (btn.classList.contains('left')) {
            carousel.scrollLeft -= SCROLL_WIDTH;
          } else {
            carousel.scrollLeft += SCROLL_WIDTH;
          }
        };
        btn.addEventListener('click', handler);
        handlers.push(() => btn.removeEventListener('click', handler));
      });

      return () => handlers.forEach(cleanup => cleanup());
    }

    function carouselEvent() {
      const carouselChildren = [...carousel.querySelectorAll('.slide-item')];
      const totalCards = carouselChildren.length;
      if (totalCards < 1) return () => {};

      const cardsPerView = Math.max(1, Math.round(carousel.offsetWidth / SCROLL_WIDTH));
      const cloneCount = Math.max(cardsPerView * 2, totalCards * 2);

      for (let i = 0; i < cloneCount; i++) {
        const card = carouselChildren[i % totalCards];
        carousel.insertAdjacentHTML('beforeend', card.outerHTML);
      }
      for (let i = 0; i < cloneCount; i++) {
        const card = carouselChildren[(totalCards - 1 - (i % totalCards))];
        carousel.insertAdjacentHTML('afterbegin', card.outerHTML);
      }

      carousel.scrollLeft = SCROLL_WIDTH * totalCards;

      const infiniteScroll = () => {
        const maxScroll = carousel.scrollWidth - carousel.offsetWidth;
        const buffer = SCROLL_WIDTH / 4;

        if (carousel.scrollLeft <= buffer) {
          carousel.classList.add('no-transition');
          carousel.scrollLeft = SCROLL_WIDTH * totalCards * 2;
          carousel.classList.remove('no-transition');
        } else if (carousel.scrollLeft >= maxScroll - buffer) {
          carousel.classList.add('no-transition');
          carousel.scrollLeft = SCROLL_WIDTH * totalCards;
          carousel.classList.remove('no-transition');
        }

        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        if (!wrapper.matches(':hover')) autoScroll();
      };

      const autoScroll = () => {
        timeoutIdRef.current = setTimeout(() => {
          if (carousel) carousel.scrollLeft += SCROLL_WIDTH;
        }, TIMEOUT);
      };

      autoScroll();

      carousel.addEventListener('scroll', infiniteScroll);
      wrapper.addEventListener('mouseenter', () => {
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      });
      wrapper.addEventListener('mouseleave', autoScroll);

      return () => {
        carousel.removeEventListener('scroll', infiniteScroll);
        wrapper.removeEventListener('mouseenter', () => {});
        wrapper.removeEventListener('mouseleave', autoScroll);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      };
    }

    const cleanupDrag = dragEvent();
    const cleanupArrows = arrowEvent();
    const cleanupCarousel = carouselEvent();

    return true;
  }

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const tryInitSlider = () => {
      if (retryCount >= maxRetries) {
        console.error('Slider: Failed to initialize after retries');
        return;
      }

      const success = initSlider();
      if (!success) {
        retryCount++;
        setTimeout(tryInitSlider, 200 * (retryCount + 1));
      }
    };

    tryInitSlider();

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  return (
    <div className="wrapper" ref={wrapperRef}>
      <div className="caret left">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </div>

      <div className="carousel-mask">
        <div className="carousel" ref={carouselRef}>
          {children}
        </div>
      </div>

      <div className="caret right">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  );
}

export default Slider;
