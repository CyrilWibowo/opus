import React, { useEffect, useRef, useState, useCallback } from 'react'

function WonderPage({ onClose, visible: isVisible, onBack }) {
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
      className={`wonder-overlay ${isVisible ? 'wonder-overlay--visible' : ''} ${animatedIn ? 'wonder-overlay--animated' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background - Full screen, NOT framed */}
      <div className="wonder-hero-fixed">
        <img
          src="/wonder-hero.jpg"
          alt="Wonder"
          className="wonder-hero-image"
          style={{ transform: `translateY(${scrollY * -0.03}px)` }}
        />
        <div className="wonder-hero-gradient" />
      </div>

      {/* Scroll Indicator */}
      <div className="page-scroll-track">
        <div ref={scrollThumbRef} className="page-scroll-thumb" />
      </div>

      {/* Back Button */}
      <button
        className="wonder-back-btn"
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
        className="wonder-content"
        style={{ transform: `translateY(${-scrollY}px)` }}
      >
        {/* Spacer for hero with scroll indicator */}
        <div className="wonder-hero-spacer">
          <div
            className="wonder-scroll-indicator"
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
        <div className="wonder-foreground">

          {/* Cards Container */}
          <div className="wonder-cards">

            {/* Home Page */}
            <article className="wonder-card wonder-page-home">
              <img src="/wonder-home.jpg" alt="" className="wonder-home-img" />
              <div className="wonder-home-explore" aria-hidden="true">explore</div>
            </article>

            {/* Photo Gallery */}
            <article className="wonder-card wonder-page-gallery">
              <div className="wonder-gallery-grid">
                <div className="wonder-gallery-col wonder-gallery-col--tall">
                  <img src="/plant-gallery-1.jpg" alt="" />
                  <img src="/plant-gallery-2.jpg" alt="" />
                  <img src="/plant-gallery-3.jpg" alt="" />
                </div>
                <div className="wonder-gallery-col wonder-gallery-col--short">
                  <img src="/plant-gallery-4.jpg" alt="" />
                  <img src="/plant-gallery-5.jpg" alt="" />
                  <img src="/plant-gallery-6.jpg" alt="" />
                </div>
                <div className="wonder-gallery-col wonder-gallery-col--mid">
                  <img src="/plant-gallery-7.jpg" alt="" />
                  <img src="/plant-gallery-8.jpg" alt="" />
                  <img src="/plant-gallery-9.jpg" alt="" />
                </div>
                <div className="wonder-gallery-col wonder-gallery-col--tall">
                  <img src="/plant-gallery-10.jpg" alt="" />
                  <img src="/plant-gallery-11.jpg" alt="" />
                  <img src="/plant-gallery-12.jpg" alt="" />
                </div>
              </div>
            </article>

            {/* Plant Display Pages */}
            {[
              { img: '/plant-display-1.jpg', title: 'Cactaceae', dims: '2667 x 4000', camera: 'Canon EOS R6', focal: '40.0mm', aperture: 'ƒ/5.0', iso: '500', shutter: '1/400 sec', date: 'Jul 23, 2021', software: 'Adobe Photoshop Lightroom Classic 9.4 (Macintosh)' },
              { img: '/plant-display-2.jpg', title: 'Crassulaceae', dims: '2667 x 4000', camera: 'Canon EOS R6', focal: '40.0mm', aperture: 'ƒ/3.2', iso: '500', shutter: '1/3200 sec', date: 'Jul 22, 2021', software: 'Adobe Photoshop CC 2018 (Macintosh)', dark: true },
              { img: '/plant-display-3.jpg', title: 'Cactaceae', dims: '2667 x 4000', camera: 'Canon EOS R6', focal: '40.0mm', aperture: 'ƒ/3.2', iso: '500', shutter: '1/1000 sec', date: 'Jul 22, 2021', software: 'Adobe Photoshop Lightroom Classic 9.4 (Macintosh)' },
            ].map((plant, i) => (
              <article key={i} className={`wonder-card wonder-page-display${plant.dark ? ' wonder-page-display--dark' : ''}${i === 0 ? ' wonder-gap-5x' : ''}`}>
                <div className="wonder-display-image">
                  <img src={plant.img} alt={plant.title} />
                  <div className="wonder-display-back" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 4L6 10L12 16" />
                    </svg>
                  </div>
                </div>
                <div className="wonder-display-info">
                  <h3 className="wonder-display-title">{plant.title}</h3>
                  <dl className="wonder-display-meta">
                    <div><dt>Dimensions</dt><dd>{plant.dims}</dd></div>
                    <div><dt>Camera</dt><dd>{plant.camera}</dd></div>
                    <div><dt>Focal</dt><dd>{plant.focal}</dd></div>
                    <div><dt>Aperture</dt><dd>{plant.aperture}</dd></div>
                    <div><dt>ISO</dt><dd>{plant.iso}</dd></div>
                    <div><dt>Shutter Speed</dt><dd>{plant.shutter}</dd></div>
                    <div><dt>Taken At</dt><dd>{plant.date}</dd></div>
                    <div><dt>Software</dt><dd>{plant.software}</dd></div>
                  </dl>
                  <div className="wonder-display-readmore" aria-hidden="true">Read More</div>
                </div>
              </article>
            ))}

            {/* Pre-end */}
            <article className="wonder-card wonder-page-end wonder-gap-5x">
              <img src="/plant-pre-end.jpg" alt="" className="wonder-end-img" />
              <div className="wonder-end-circle" aria-hidden="true" />
            </article>

            {/* End pages */}
            <article className="wonder-card wonder-page-end wonder-gap-5x">
              <img src="/plant-end-1.jpg" alt="" className="wonder-end-img" />
            </article>
            <article className="wonder-card wonder-page-end">
              <img src="/plant-end-2.jpg" alt="" className="wonder-end-img" />
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}

export default WonderPage
