import React, { useEffect, useRef, useState, useCallback } from 'react'

function LovePage({ onClose, visible: isVisible, onBack }) {
  const [animatedIn, setAnimatedIn] = useState(false)
  const contentRef = useRef(null)
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
      heroImgRef.current.style.transform = `scale(1.05) translate(-0.6%, ${y * -0.03}px)`
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
      className={`love-overlay ${isVisible ? 'love-overlay--visible' : ''} ${animatedIn ? 'love-overlay--animated' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background */}
      <div className="love-hero-fixed">
        <img
          ref={heroImgRef}
          src="/love-hero.jpg"
          alt="Love"
          className="love-hero-image"
          style={{ transform: 'scale(1.05) translate(-0.6%, 0px)' }}
        />
        <div className="love-hero-gradient" />
      </div>

      {/* Scroll Indicator */}
      <div className="page-scroll-track">
        <div ref={scrollThumbRef} className="page-scroll-thumb" />
      </div>

      {/* Back Button */}
      <button
        className="love-back-btn"
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
        className="love-content"
      >
        <div className="love-hero-spacer">
          <div
            className="love-scroll-indicator"
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

        <div className="love-foreground">
          <div className="love-cards">

            {/* Card 1: Home / Landing */}
            <article className="love-card love-page-home">
              <img src="/love-home.jpg" alt="" className="love-home-img" />
              <div className="love-home-overlay">
                <div className="love-home-headline">
                  <p className="love-home-tagline">Explore the City of Love</p>
                  <p className="love-home-sub">Where every street tells a story and every moment becomes a memory</p>
                  <div className="love-home-cta">Begin Your Journey</div>
                </div>
              </div>
            </article>

            {/* Card 2: Eiffel Tower — image left, text right */}
            <article className="love-card love-page-spread love-gap-5x">
              <div className="love-spread-image">
                <img src="/eiffel-tower.jpg" alt="" />
              </div>
              <div className="love-spread-text">
                <div className="love-spread-nav" aria-hidden="true">
                  <span>Discover</span>
                  <span>Attractions</span>
                  <span>Plan Your Trip</span>
                </div>
                <span className="love-spread-number">01</span>
                <h3 className="love-spread-title">Tour Eiffel</h3>
                <div className="love-spread-divider" />
                <p className="love-spread-desc">Standing 330 metres above the Parisian skyline, the Iron Lady has been the symbol of romance since 1889. At dusk, 20,000 light bulbs illuminate the tower in a spectacle that has captivated lovers for over a century.</p>
                <div className="love-spread-meta">
                  <span>Champ de Mars, 7th arr.</span>
                  <span>Open daily</span>
                </div>
                <div className="love-spread-next">Next &rarr;</div>
              </div>
            </article>

            {/* Card 3: Louvre — full width with overlay */}
            <article className="love-card love-page-full">
              <img src="/louvre-museum.jpg" alt="" className="love-full-img" />
              <div className="love-full-overlay">
                <div className="love-full-nav" aria-hidden="true">
                  <span>Discover</span>
                  <span>Attractions</span>
                  <span>Plan Your Trip</span>
                </div>
                <div className="love-full-bottom">
                  <span className="love-full-number">02</span>
                  <h3 className="love-full-title">Mus&eacute;e du Louvre</h3>
                  <p className="love-full-desc">The world's most visited museum — 380,000 works of art beneath a glass pyramid that bridges centuries of history and modernity.</p>
                  <div className="love-full-next">Next &rarr;</div>
                </div>
              </div>
            </article>

            {/* Card 5: End image */}
            <article className="love-card love-page-end love-gap-5x">
              <img src="/love-end.jpg" alt="" className="love-end-img" />
            </article>

            {/* Card 6: Closing quote */}
            <article className="love-card love-page-quote">
              <div className="love-quote-content">
                <svg className="love-quote-fleur" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M20 5c0 8-7 12-7 15s3 5 7 5 7-2 7-5-7-7-7-15z" />
                  <path d="M20 5c0 8 7 12 7 15s-3 5-7 5-7-2-7-5 7-7 7-15z" />
                  <path d="M20 2v3M20 35v3M15 25c-2 2-5 2-5 2M25 25c2 2 5 2 5 2" />
                </svg>
                <blockquote className="love-quote-text">
                  "Paris is always a good idea."
                </blockquote>
                <p className="love-quote-attr">— Audrey Hepburn</p>
                <div className="love-quote-cta">Plan Your Visit</div>
              </div>
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}

export default LovePage
