import React, { useEffect, useRef, useState, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// CURIOSITY - A Visual Journey Through History
// Uses momentum-based scrolling like the about section
// ═══════════════════════════════════════════════════════════════════════════════

const sections = [
  {
    id: 'alexandria',
    image: '/library-of-alexandria.webp',
    philosophical: 'We find purpose in gathering what we don\'t yet know',
    caption: 'The Library of Alexandria, c. 300 BCE—humanity\'s first great attempt to collect all knowledge',
  },
  {
    id: 'davinci',
    image: '/leonardo-da-vinci-anatomical-scan.avif',
    philosophical: 'To question everything is to live fully',
    caption: 'Leonardo da Vinci\'s notebooks, 1480s-1519—over 7,000 pages of relentless inquiry into how the world works',
  },
  {
    id: 'galileo',
    image: '/galileo-telescope.jpg',
    philosophical: 'Meaning emerges when we dare to look closer',
    caption: 'Galileo turns his telescope to the heavens, 1609—discovering moons around Jupiter and forever changing our place in the cosmos',
  },
  {
    id: 'darwin',
    image: '/HMS_beagle.jpg',
    philosophical: 'Our lives gain depth through patient observation',
    caption: 'Charles Darwin\'s voyage on HMS Beagle, 1831-1836—five years of careful attention to finches, tortoises, and the patterns of life',
  },
  {
    id: 'curie',
    image: '/marie-curie-a-paris-dans-son-premier-laboratoire.jpg',
    philosophical: 'We become who we are by pursuing what others overlook',
    caption: 'Marie Curie discovers radium and polonium, 1898—the first woman to win a Nobel Prize, driven by questions about the invisible',
  },
  {
    id: 'earthrise',
    image: '/apollo08_earthrise.webp',
    philosophical: 'Sometimes we discover ourselves by seeking the unknown',
    caption: 'Earthrise, photographed from Apollo 8, December 1968—astronauts journeyed to another world and found a new way to see home',
  },
  {
    id: 'hubble',
    image: '/Hubble Deep Field (NASA).webp',
    philosophical: 'Meaning lives in the questions we ask of empty space',
    caption: 'The Hubble Deep Field, 1995—astronomers pointed a telescope at apparent nothingness for ten days and revealed 3,000 galaxies',
  }
]

function CuriosityPage({ onClose }) {
  const [visible, setVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const contentRef = useRef(null)

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
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

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
  }, [visible])

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
        setScrollY(Math.max(0, Math.min(maxScroll.current, scrollPos.current)))
        scrollRaf.current = null
        return
      }
    }

    setScrollY(Math.max(0, Math.min(maxScroll.current, scrollPos.current)))
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

    dragVelocity.current = (deltaY / deltaTime) * 2
    scrollPos.current += deltaY * 0.4

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

  // Calculate hero opacity based on scroll
  const heroOpacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.5))

  return (
    <div
      className={`curiosity-overlay ${visible ? 'curiosity-overlay--visible' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background */}
      <div className="curiosity-hero-fixed" style={{ opacity: heroOpacity }}>
        <img
          src="/moon_landing.avif"
          alt="Moon landing"
          className="curiosity-hero-image"
        />
        <div className="curiosity-hero-gradient" />
        <div className="curiosity-hero-content">
          <h1 className="curiosity-hero-title">CURIOSITY</h1>
          <p className="curiosity-hero-subtitle">The meaning we create through questions</p>
        </div>
        <div className="curiosity-scroll-indicator">
          <span>Scroll to explore</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      {/* Close Button */}
      <button
        className="curiosity-close-btn"
        onClick={onClose}
        aria-label="Close"
        onMouseDown={stopProp}
        onTouchStart={stopProp}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>

      {/* Scrollable Content - transformed by scrollY */}
      <div
        ref={contentRef}
        className="curiosity-content"
        style={{ transform: `translateY(${-scrollY}px)` }}
      >
        {/* Spacer for hero */}
        <div className="curiosity-hero-spacer" />

        {/* Foreground with framed cards */}
        <div className="curiosity-foreground">

          {/* Cards Container */}
          <div className="curiosity-cards">
            {sections.map((section, index) => (
              <article key={section.id} className="curiosity-card">
                <img
                  src={section.image}
                  alt={section.caption}
                  className="curiosity-card-image"
                  loading={index < 2 ? 'eager' : 'lazy'}
                />
                <p className="curiosity-card-caption">{section.caption}</p>
              </article>
            ))}
          </div>

          {/* Closing Section */}
          <div className="curiosity-closing">
            <p className="curiosity-closing-philosophical">Your curiosity is your compass</p>
            <p className="curiosity-closing-subtext">What questions give your life meaning?</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CuriosityPage
