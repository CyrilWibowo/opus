import React, { useEffect, useRef, useState, useCallback } from 'react'

function DeathPage({ onClose, visible: isVisible, onBack }) {
  const [animatedIn, setAnimatedIn] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const contentRef = useRef(null)
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

  // Calculate max scroll based on content height
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

  // Momentum tick function
  const tick = useCallback(() => {
    if (!dragging.current) {
      const speed = Math.abs(scrollVelocity.current)
      const friction = speed < 0.3 ? 0.88 : 0.94
      scrollPos.current += scrollVelocity.current
      scrollVelocity.current *= friction

      // Bounce at edges
      if (scrollPos.current < 0) {
        scrollPos.current += (0 - scrollPos.current) * 0.08
        scrollVelocity.current *= 0.3
      } else if (scrollPos.current > maxScroll.current) {
        scrollPos.current += (maxScroll.current - scrollPos.current) * 0.08
        scrollVelocity.current *= 0.3
      }

      // Stop when velocity is very low
      if (Math.abs(scrollVelocity.current) < 0.02 && scrollPos.current >= 0 && scrollPos.current <= maxScroll.current) {
        scrollVelocity.current = 0
        const yy = Math.max(0, Math.min(maxScroll.current, scrollPos.current))
        setScrollY(yy)
        if (scrollThumbRef.current && maxScroll.current > 0) {
          const pct = Math.min(1, Math.max(0, yy / maxScroll.current))
          const trackH = 80
          const thumbH = Math.max(12, trackH * (window.innerHeight / (maxScroll.current + window.innerHeight)))
          scrollThumbRef.current.style.height = `${thumbH}px`
          scrollThumbRef.current.style.transform = `translateY(${pct * (trackH - thumbH)}px)`
        }
        scrollRaf.current = null
        return
      }
    }

    const y = Math.max(0, Math.min(maxScroll.current, scrollPos.current))
    setScrollY(y)
    if (scrollThumbRef.current && maxScroll.current > 0) {
      const pct = Math.min(1, Math.max(0, y / maxScroll.current))
      const trackH = 80
      const thumbH = Math.max(12, trackH * (window.innerHeight / (maxScroll.current + window.innerHeight)))
      scrollThumbRef.current.style.height = `${thumbH}px`
      scrollThumbRef.current.style.transform = `translateY(${pct * (trackH - thumbH)}px)`
    }
    scrollRaf.current = requestAnimationFrame(tick)
  }, [])

  const startTick = useCallback(() => {
    if (!scrollRaf.current) {
      scrollRaf.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Wheel handler
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    scrollVelocity.current += e.deltaY * 0.08
    startTick()
  }, [startTick])

  // Drag handlers
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

  // Attach global move/end listeners
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
      className={`death-overlay ${isVisible ? 'death-overlay--visible' : ''} ${animatedIn ? 'death-overlay--animated' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background - Full screen, NOT framed */}
      <div className="death-hero-fixed">
        <img
          src="/death-hero.jpg"
          alt="Death"
          className="death-hero-image"
          style={{ transform: `translateY(${scrollY * -0.03}px)` }}
        />
        <div className="death-hero-gradient" />
      </div>

      {/* Scroll Indicator */}
      <div className="page-scroll-track">
        <div ref={scrollThumbRef} className="page-scroll-thumb" />
      </div>

      {/* Back Button */}
      <button
        className="death-back-btn"
        onClick={onBack}
        aria-label="Back"
        onMouseDown={stopProp}
        onTouchStart={stopProp}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4L6 10L12 16" />
        </svg>
      </button>

      {/* Scrollable Content - transformed by scrollY */}
      <div
        ref={contentRef}
        className="death-content"
        style={{ transform: `translateY(${-scrollY}px)` }}
      >
        {/* Spacer for hero with scroll indicator */}
        <div className="death-hero-spacer">
          <div
            className="death-scroll-indicator"
            onClick={(e) => {
              e.stopPropagation()
              const targetScroll = window.innerHeight
              const duration = 800
              const start = scrollPos.current
              const startTime = performance.now()

              const animateScroll = () => {
                const elapsed = performance.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 4) // ease-out (faster start)

                scrollPos.current = start + (targetScroll - start) * eased
                setScrollY(scrollPos.current)

                if (progress < 1) {
                  requestAnimationFrame(animateScroll)
                }
              }
              requestAnimationFrame(animateScroll)
            }}
            onMouseDown={stopProp}
            onTouchStart={stopProp}
          >
            <span>Scroll to explore</span>
          </div>
        </div>

        {/* Foreground with framed pages */}
        <div className="death-foreground">

          {/* Cards Container */}
          <div className="death-cards">

            {/* Home Page */}
            <article className="death-card death-page-home">
              <img src="/death-home.jpg" alt="" className="death-home-img" />
              <div className="death-home-arrow">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 2L14 14L26 2" />
                </svg>
              </div>
            </article>

            {/* Page 1 - White background with 5 wheel images */}
            <article className="death-card death-page-wheel">
              <div className="death-wheel-arrow death-wheel-arrow--left">
                <svg width="16" height="28" viewBox="0 0 16 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2L2 14L14 26" />
                </svg>
              </div>
              <div className="death-wheel-arrow death-wheel-arrow--right">
                <svg width="16" height="28" viewBox="0 0 16 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 2L14 14L2 26" />
                </svg>
              </div>
              {/* Top ornament */}
              <div className="death-wheel-ornament">
                <div className="death-wheel-ornament-line" />
                <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 C45 5, 40 10, 35 10 C30 10, 25 5, 20 5 C15 5, 10 10, 5 15 C10 15, 15 20, 20 20 C25 20, 30 15, 35 15 C40 15, 45 20, 50 25 C55 20, 60 15, 65 15 C70 15, 75 20, 80 20 C85 20, 90 15, 95 15 C90 10, 85 5, 80 5 C75 5, 70 10, 65 10 C60 10, 55 5, 50 5Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <div className="death-wheel-ornament-line" />
              </div>

              <div className="death-wheel-images">
                <img src="/death-wheel-1.jpg" alt="" className="death-wheel-img" />
                <img src="/death-wheel-2.jpg" alt="" className="death-wheel-img" />
                <img src="/death-wheel-3.jpg" alt="" className="death-wheel-img death-wheel-img--large" />
                <img src="/death-wheel-4.jpg" alt="" className="death-wheel-img" />
                <img src="/death-wheel-5.jpg" alt="" className="death-wheel-img" />
              </div>

              <div className="death-wheel-dots">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={i} className={`death-wheel-dot${i === 3 ? ' death-wheel-dot--active' : ''}`} />
                ))}
              </div>

              {/* Bottom ornament */}
              <div className="death-wheel-ornament">
                <div className="death-wheel-ornament-line" />
                <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 25 C45 25, 40 20, 35 20 C30 20, 25 25, 20 25 C15 25, 10 20, 5 15 C10 15, 15 10, 20 10 C25 10, 30 15, 35 15 C40 15, 45 10, 50 5 C55 10, 60 15, 65 15 C70 15, 75 10, 80 10 C85 10, 90 15, 95 15 C90 20, 85 25, 80 25 C75 25, 70 20, 65 20 C60 20, 55 25, 50 25Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <div className="death-wheel-ornament-line" />
              </div>
            </article>

            {/* Page 2 - 50-50 split, image left, quote right */}
            <article className="death-card death-page-quote">
              <div className="death-page-quote-image">
                <img src="/death-1.jpg" alt="" />
                <div className="death-quote-back-btn" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 4L6 10L12 16" />
                  </svg>
                </div>
              </div>
              <div className="death-page-quote-text">
                {/* Ornament - centered on whole right side */}
                <div className="death-quote-ornament">
                  <div className="death-quote-ornament-line" />
                  <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5 C45 5, 40 10, 35 10 C30 10, 25 5, 20 5 C15 5, 10 10, 5 15 C10 15, 15 20, 20 20 C25 20, 30 15, 35 15 C40 15, 45 20, 50 25 C55 20, 60 15, 65 15 C70 15, 75 20, 80 20 C85 20, 90 15, 95 15 C90 10, 85 5, 80 5 C75 5, 70 10, 65 10 C60 10, 55 5, 50 5Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  <div className="death-quote-ornament-line" />
                </div>

                {/* Top half - empty */}
                <div className="death-quote-top"></div>

                {/* Bottom half - quote */}
                <div className="death-quote-content">
                  <blockquote className="death-quote">
                    "The world breaks everyone and afterward many are strong in the broken places. But those that will not break it kills. It kills the very good and the very gentle and the very brave impartially. If you are none of these you can be sure it will kill you too but there will be no special hurry."
                  </blockquote>
                  <p className="death-attribution">
                    —Ernest Hemingway, A Farewell to Arms
                  </p>
                </div>
              </div>
            </article>

            {/* Page 3 - Full image with "so it goes" */}
            <article className="death-card death-page-soitgoes">
              <img src="/death-2.jpg" alt="" className="death-page-soitgoes-image" />
              <div className="death-page-soitgoes-overlay">
                <p className="death-soitgoes-text">so it goes</p>
              </div>
            </article>

            {/* Page 4 - Just image, no text */}
            <article className="death-card death-page-end">
              <img src="/death-end-1.jpg" alt="" className="death-end-image" />
            </article>

            {/* Page 5 - Just image, no text */}
            <article className="death-card death-page-end">
              <img src="/death-end-2.jpg" alt="" className="death-end-image" />
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DeathPage
