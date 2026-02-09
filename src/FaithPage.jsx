import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'

const BOOKS = [
  { img: '/books/Pride-and-Prejudice--Jane-Austen.jpg', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { img: '/books/Sense-and-Sensibility--Jane-Austen.jpg', title: 'Sense and Sensibility', author: 'Jane Austen' },
  { img: '/books/Emma--Jane-Austen.jpg', title: 'Emma', author: 'Jane Austen' },
  { img: '/books/Persuasion--Jane-Austen.jpg', title: 'Persuasion', author: 'Jane Austen' },
  { img: '/books/Mansfield-Park--Jane-Austen.jpg', title: 'Mansfield Park', author: 'Jane Austen' },
  { img: '/books/Northanger-Abbey--Jane-Austen.jpg', title: 'Northanger Abbey', author: 'Jane Austen' },
  { img: '/books/Love-and-Friendship-and-Other-Youthful-Writings--Jane-Austen.jpg', title: 'Love and Freindship', author: 'Jane Austen' },
  { img: '/books/Sandition--Jane-Austen.jpg', title: 'Sanditon', author: 'Jane Austen' },
  { img: '/books/Little-Women--Louisa-May-Alcott.jpg', title: 'Little Women', author: 'Louisa May Alcott' },
  { img: '/books/Meditations--Marcus-Aurelius.jpg', title: 'Meditations', author: 'Marcus Aurelius' },
]

function FaithPage({ onClose, visible: isVisible, onBack }) {
  const [animatedIn, setAnimatedIn] = useState(false)
  const contentRef = useRef(null)
  const cardsRef = useRef(null)
  const heroImgRef = useRef(null)
  const scrollThumbRef = useRef(null)

  // Momentum scrolling state
  const scrollPos = useRef(0)
  const scrollVelocity = useRef(0)
  const scrollRaf = useRef(null)
  const dragging = useRef(false)
  const dragLastY = useRef(0)
  const dragLastTime = useRef(0)
  const dragVelocity = useRef(0)
  const maxScroll = useRef(0)

  useEffect(() => {
    if (isVisible) {
      const t = requestAnimationFrame(() => setAnimatedIn(true))
      return () => cancelAnimationFrame(t)
    } else {
      setAnimatedIn(false)
    }
  }, [isVisible])

  // Scale cards container to fit viewport width
  useLayoutEffect(() => {
    const el = cardsRef.current
    if (!el) return
    const update = () => {
      const parentWidth = el.parentElement?.offsetWidth || window.innerWidth
      const scale = Math.min(1, parentWidth / 800)
      el.style.zoom = String(scale)
    }
    update()
    const observer = new ResizeObserver(update)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    const updateMaxScroll = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight
        const viewHeight = window.innerHeight
        maxScroll.current = Math.max(0, contentHeight - viewHeight)
      }
    }
    updateMaxScroll()
    window.addEventListener('resize', updateMaxScroll)
    return () => window.removeEventListener('resize', updateMaxScroll)
  }, [isVisible])

  const applyScroll = useCallback((y) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-y}px)`
    }
    if (heroImgRef.current) {
      heroImgRef.current.style.transform = `scale(1.05) translateY(${y * -0.03}px)`
    }
    if (scrollThumbRef.current && maxScroll.current > 0) {
      const pct = Math.min(1, Math.max(0, y / maxScroll.current))
      const trackH = 80
      const thumbH = Math.max(12, trackH * (window.innerHeight / (maxScroll.current + window.innerHeight)))
      scrollThumbRef.current.style.height = `${thumbH}px`
      scrollThumbRef.current.style.transform = `translateY(${pct * (trackH - thumbH)}px)`
    }
  }, [])

  const tick = useCallback(() => {
    if (!dragging.current) {
      const speed = Math.abs(scrollVelocity.current)
      const friction = speed < 0.3 ? 0.88 : 0.94
      scrollPos.current += scrollVelocity.current
      scrollVelocity.current *= friction

      if (scrollPos.current < 0) {
        scrollPos.current += (0 - scrollPos.current) * 0.08
        scrollVelocity.current *= 0.3
      } else if (scrollPos.current > maxScroll.current) {
        scrollPos.current += (maxScroll.current - scrollPos.current) * 0.08
        scrollVelocity.current *= 0.3
      }

      if (Math.abs(scrollVelocity.current) < 0.02 && scrollPos.current >= 0 && scrollPos.current <= maxScroll.current) {
        scrollVelocity.current = 0
        applyScroll(Math.max(0, Math.min(maxScroll.current, scrollPos.current)))
        scrollRaf.current = null
        return
      }
    }

    applyScroll(Math.max(0, Math.min(maxScroll.current, scrollPos.current)))
    scrollRaf.current = requestAnimationFrame(tick)
  }, [applyScroll])

  const startTick = useCallback(() => {
    if (!scrollRaf.current) {
      scrollRaf.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    scrollVelocity.current += e.deltaY * 0.08
    startTick()
  }, [startTick])

  const handleDragStart = useCallback((e) => {
    dragging.current = true
    const y = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragLastY.current = y
    dragLastTime.current = Date.now()
    dragVelocity.current = 0
    scrollVelocity.current = 0
    startTick()
  }, [startTick])

  const handleDragMove = useCallback((e) => {
    if (!dragging.current) return
    e.preventDefault()
    const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    const now = Date.now()
    const deltaY = dragLastY.current - y
    const deltaTime = Math.max(1, now - dragLastTime.current)
    dragVelocity.current = (deltaY / deltaTime) * 5
    scrollPos.current += deltaY * 1.5
    dragLastY.current = y
    dragLastTime.current = now
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    scrollVelocity.current = dragVelocity.current
    startTick()
  }, [startTick])

  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleDragMove, { passive: false })
    window.addEventListener('touchend', handleDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
    }
  }, [handleDragMove, handleDragEnd])

  const stopProp = useCallback((e) => {
    e.stopPropagation()
  }, [])

  return (
    <div
      className={`faith-overlay ${isVisible ? 'faith-overlay--visible' : ''} ${animatedIn ? 'faith-overlay--animated' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background */}
      <div className="faith-hero-fixed">
        <img
          ref={heroImgRef}
          src="/faith-hero.jpg"
          alt="Faith"
          className="faith-hero-image"
          style={{ transform: 'scale(1.05) translateY(0px)' }}
        />
        <div className="faith-hero-gradient" />
      </div>

      {/* Scroll Indicator */}
      <div className="page-scroll-track">
        <div ref={scrollThumbRef} className="page-scroll-thumb" />
      </div>

      {/* Back Button */}
      <button
        className="faith-back-btn"
        onClick={onBack}
        aria-label="Back"
        onMouseDown={stopProp}
        onTouchStart={stopProp}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4L6 10L12 16" />
        </svg>
      </button>

      {/* Scrollable Content */}
      <div
        ref={contentRef}
        className="faith-content"
      >
        <div className="faith-hero-spacer">
          <div
            className="faith-scroll-indicator"
            onClick={(e) => {
              e.stopPropagation()
              const targetScroll = window.innerHeight
              const duration = 800
              const start = scrollPos.current
              const startTime = performance.now()
              const animateScroll = () => {
                const elapsed = performance.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 4)
                scrollPos.current = start + (targetScroll - start) * eased
                applyScroll(scrollPos.current)
                if (progress < 1) requestAnimationFrame(animateScroll)
              }
              requestAnimationFrame(animateScroll)
            }}
            onMouseDown={stopProp}
            onTouchStart={stopProp}
          >
            <span>Scroll to explore</span>
          </div>
        </div>

        <div className="faith-foreground">
          <div ref={cardsRef} className="faith-cards">

            {/* Home Page */}
            <article className="faith-card faith-page-home">
              <img src="/faith-home.jpg" alt="" className="faith-home-img" />
              <div className="faith-home-overlay">
                <p className="faith-home-tagline">Explore the Classics</p>
              </div>
              <div className="faith-home-arrow" aria-hidden="true">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 2L14 14L26 2" />
                </svg>
              </div>
            </article>

            {/* Book Gallery */}
            <article className="faith-card faith-page-gallery">
              <div className="faith-gallery-grid">
                {BOOKS.map((book, i) => (
                  <div key={i} className="faith-gallery-item">
                    <img src={book.img} alt={book.title} />
                  </div>
                ))}
              </div>
              <div className="faith-gallery-cart" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                <span className="faith-gallery-cart-badge">3</span>
              </div>
            </article>

            {/* Book Preview - Light */}
            <article className="faith-card faith-page-preview faith-gap-5x">
              <div className="faith-preview-back" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 4L6 10L12 16" />
                </svg>
              </div>
              <div className="faith-preview-cover">
                <img src="/books/Pride-and-Prejudice--Jane-Austen.jpg" alt="Pride and Prejudice" />
              </div>
              <div className="faith-preview-info">
                <h3 className="faith-preview-title">Pride and Prejudice</h3>
                <p className="faith-preview-author">Jane Austen</p>
                <div className="faith-preview-stars">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className="faith-star faith-star--filled">{s}</span>)}
                  <span className="faith-preview-rating">4.28</span>
                  <span className="faith-preview-reviews">1,987,435 ratings</span>
                </div>
                <div className="faith-preview-divider" />
                <p className="faith-preview-desc">Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.</p>
                <dl className="faith-preview-meta">
                  <div><dt>Format</dt><dd>Clothbound Hardcover</dd></div>
                  <div><dt>Pages</dt><dd>480</dd></div>
                  <div><dt>Publisher</dt><dd>Penguin Classics</dd></div>
                  <div><dt>Published</dt><dd>October 2008</dd></div>
                </dl>
                <div className="faith-preview-price">$22.00</div>
                <div className="faith-preview-btn">Add to Cart</div>
              </div>
            </article>

            {/* Book Preview - Dark */}
            <article className="faith-card faith-page-preview faith-page-preview--dark">
              <div className="faith-preview-back" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 4L6 10L12 16" />
                </svg>
              </div>
              <div className="faith-preview-cover">
                <img src="/books/Meditations--Marcus-Aurelius.jpg" alt="Meditations" />
              </div>
              <div className="faith-preview-info">
                <h3 className="faith-preview-title">Meditations</h3>
                <p className="faith-preview-author">Marcus Aurelius</p>
                <div className="faith-preview-stars">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className={`faith-star${i < 4 ? ' faith-star--filled' : ''}`}>{s}</span>)}
                  <span className="faith-preview-rating">4.12</span>
                  <span className="faith-preview-reviews">387,219 ratings</span>
                </div>
                <div className="faith-preview-divider" />
                <p className="faith-preview-desc">Written in Greek by the only Roman emperor who was also a philosopher, without any intention of publication, the Meditations of Marcus Aurelius offer a remarkable series of challenging spiritual reflections.</p>
                <dl className="faith-preview-meta">
                  <div><dt>Format</dt><dd>Pocket Hardcover</dd></div>
                  <div><dt>Pages</dt><dd>256</dd></div>
                  <div><dt>Publisher</dt><dd>Penguin Classics</dd></div>
                  <div><dt>Published</dt><dd>September 2014</dd></div>
                </dl>
                <div className="faith-preview-price">$16.00</div>
                <div className="faith-preview-btn">Add to Cart</div>
              </div>
            </article>

            {/* End */}
            <article className="faith-card faith-page-end faith-gap-5x">
              <img src="/faith-end.jpg" alt="" className="faith-end-img" />
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}

export default FaithPage
