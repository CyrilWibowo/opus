import React, { useEffect, useRef, useState, useCallback } from 'react'

const PIECE = {
  K:'/king-white.webp', Q:'/queen-white.webp', R:'/rook-white.webp',
  N:'/knight-white.png', P:'/pawn-white.png',
  k:'/king-black.png', q:'/queen-black.png', r:'/rook-black.webp',
  b:'/bishop-black.png', n:'/knight-black.png', p:'/pawn-black.png'
}

// Ruy Lopez after 5. O-O
const GAME1 = [
  'r','','b','q','k','b','','r',
  '','p','p','p','','p','p','p',
  'p','','n','','','n','','',
  '','','','','p','','','',
  'B','','','','P','','','',
  '','','','','','N','','',
  'P','P','P','P','','P','P','P',
  'R','N','','Q','','R','K',''
]

// QGD after 5. Bf4
const GAME2 = [
  'r','n','b','q','k','','','r',
  'p','p','p','','b','p','p','p',
  '','','','','p','n','','',
  '','','','p','','','','',
  '','','P','P','','B','','',
  '','','N','','','N','','',
  'P','P','','','P','P','P','P',
  'R','','','Q','K','B','','R'
]

function PowerPage({ onClose, visible: isVisible, onBack }) {
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

  // Direct DOM update — no React re-render
  const applyScroll = useCallback((y) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-y}px)`
    }
    if (heroImgRef.current) {
      heroImgRef.current.style.transform = `scale(1.1) translate(-1%, calc(-3% + ${y * -0.03}px))`
    }
    if (scrollThumbRef.current && maxScroll.current > 0) {
      const pct = Math.min(1, Math.max(0, y / maxScroll.current))
      const trackH = 80
      const thumbH = Math.max(12, trackH * (window.innerHeight / (maxScroll.current + window.innerHeight)))
      scrollThumbRef.current.style.height = `${thumbH}px`
      scrollThumbRef.current.style.transform = `translateY(${pct * (trackH - thumbH)}px)`
    }
  }, [])

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
      className={`power-overlay ${isVisible ? 'power-overlay--visible' : ''} ${animatedIn ? 'power-overlay--animated' : ''}`}
      onMouseDown={(e) => { stopProp(e); handleDragStart(e) }}
      onTouchStart={(e) => { stopProp(e); handleDragStart(e) }}
      onWheel={handleWheel}
    >
      {/* Fixed Hero Background */}
      <div className="power-hero-fixed">
        <img
          ref={heroImgRef}
          src="/power-hero.jpg"
          alt="Power"
          className="power-hero-image"
          style={{ transform: 'scale(1.1) translate(-1%, -3%)' }}
        />
        <div className="power-hero-gradient" />
      </div>

      {/* Scroll Indicator */}
      <div className="page-scroll-track">
        <div ref={scrollThumbRef} className="page-scroll-thumb" />
      </div>

      {/* Back Button */}
      <button
        className="power-back-btn"
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
        className="power-content"
      >
        {/* Spacer for hero with scroll indicator */}
        <div className="power-hero-spacer">
          <div
            className="power-scroll-indicator"
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
        <div className="power-foreground">
          <div className="power-cards">

            {/* Home Page */}
            <article className="power-card power-page-home">
              <img src="/power-home.jpg" alt="" className="power-home-img" />
              <div className="power-home-ui" aria-hidden="true">
                <div className="power-home-actions">
                  <div className="power-home-cta">Play Chess Online</div>
                  <div className="power-home-cta-sub">Challenge players worldwide. Free to play.</div>
                  <div className="power-home-btn-row">
                    <div className="power-home-btn power-home-btn--outline">Log In</div>
                    <div className="power-home-btn power-home-btn--filled">Sign Up</div>
                  </div>
                </div>
              </div>
            </article>

            {/* Chess Homepage */}
            <article className="power-card power-page-chess" aria-hidden="true">
              <div className="power-chess-sidebar">
                <div className="power-chess-logo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="2">
                    <path d="M12 2L9 7H6L8 12H5L7 17H17L19 12H16L18 7H15L12 2Z" />
                    <rect x="7" y="17" width="10" height="3" rx="1" />
                  </svg>
                  <span className="power-chess-logo-text">Play</span>
                </div>
                <nav className="power-chess-nav">
                  <div className="power-chess-nav-item power-chess-nav-item--active">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
                    Home
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                    Play
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Puzzles
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    Learn
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    Watch
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v18M18 3v18M6 9h12M6 15h12M3 6h3M18 6h3M3 18h3M18 18h3"/></svg>
                    Tournaments
                  </div>
                </nav>
                <div className="power-chess-nav-divider" />
                <div className="power-chess-nav-label">Community</div>
                <nav className="power-chess-nav power-chess-nav--community">
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    Friends
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Messages
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    Notifications
                  </div>
                </nav>
                <div className="power-chess-profile">
                  <div className="power-chess-avatar" />
                  <span className="power-chess-profile-name">Guest</span>
                </div>
              </div>
              <div className="power-chess-main">
                <div className="power-chess-section-header">
                  <span>Quick Play</span>
                  <div className="power-chess-header-line" />
                </div>
                <div className="power-chess-modes">
                  <div className="power-chess-mode-card">
                    <div className="power-chess-mode-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="power-chess-mode-label">Rapid</div>
                    <div className="power-chess-mode-time">10 min</div>
                    <div className="power-chess-mode-elo">1247</div>
                  </div>
                  <div className="power-chess-mode-card">
                    <div className="power-chess-mode-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="1.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div className="power-chess-mode-label">Blitz</div>
                    <div className="power-chess-mode-time">3 min</div>
                    <div className="power-chess-mode-elo">1184</div>
                  </div>
                  <div className="power-chess-mode-card">
                    <div className="power-chess-mode-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="1.5" style={{transform: 'rotate(135deg)'}}>
                        <path d="M7 12h1v9h8v-9h1V10c0-3-2-6-5-8-3 2-5 5-5 8v2z" />
                      </svg>
                    </div>
                    <div className="power-chess-mode-label">Bullet</div>
                    <div className="power-chess-mode-time">1 min</div>
                    <div className="power-chess-mode-elo">1102</div>
                  </div>
                </div>
                <div className="power-chess-more-modes">Browse more modes →</div>
                <div className="power-chess-banner">
                  <img src="/chess-banner.jpg" alt="" className="power-chess-banner-img" />
                  <div className="power-chess-banner-overlay">
                    <div className="power-chess-banner-title">FIDE World Cup 2026</div>
                    <div className="power-chess-banner-sub">Round 5 — Live now</div>
                  </div>
                </div>
                <div className="power-chess-puzzle-strip">
                  <div className="power-chess-puzzle-info">
                    <div className="power-chess-puzzle-title">Daily Puzzle</div>
                    <div className="power-chess-puzzle-desc">White to move — find the winning combination</div>
                  </div>
                  <div className="power-chess-puzzle-btn">Solve</div>
                </div>
              </div>
            </article>

            {/* Game 1 */}
            <article className="power-card power-page-game power-gap-5x" aria-hidden="true">
              <div className="power-chess-sidebar">
                <div className="power-chess-logo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="2">
                    <path d="M12 2L9 7H6L8 12H5L7 17H17L19 12H16L18 7H15L12 2Z" />
                    <rect x="7" y="17" width="10" height="3" rx="1" />
                  </svg>
                  <span className="power-chess-logo-text">Play</span>
                </div>
                <nav className="power-chess-nav">
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
                    Home
                  </div>
                  <div className="power-chess-nav-item power-chess-nav-item--active">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                    Play
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Puzzles
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    Learn
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    Watch
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v18M18 3v18M6 9h12M6 15h12M3 6h3M18 6h3M3 18h3M18 18h3"/></svg>
                    Tournaments
                  </div>
                </nav>
                <div className="power-chess-nav-divider" />
                <div className="power-chess-nav-label">Community</div>
                <nav className="power-chess-nav power-chess-nav--community">
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    Friends
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Messages
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    Notifications
                  </div>
                </nav>
                <div className="power-chess-profile">
                  <div className="power-chess-avatar" />
                  <span className="power-chess-profile-name">Guest</span>
                </div>
              </div>
              <div className="power-game-main power-game-main--light">
                <div className="power-game-board">
                  <div className="power-game-grid">
                    {GAME1.map((piece, i) => {
                      const row = Math.floor(i / 8)
                      const col = i % 8
                      const isLight = (row + col) % 2 === 0
                      return <div key={i} className={`power-game-square ${isLight ? 'power-game-square--light' : 'power-game-square--dark'}`}>{piece && PIECE[piece] && <img src={PIECE[piece]} alt="" className="power-game-piece" />}</div>
                    })}
                  </div>
                </div>
                <div className="power-game-panel">
                  <div className="power-game-player-block">
                    <div className="power-game-player-avatar" />
                    <div className="power-game-player-title">GM</div>
                    <div className="power-game-player-name">Hikaru N.</div>
                    <div className="power-game-player-rating">2794</div>
                    <div className="power-game-clock">1:42</div>
                  </div>
                  <div className="power-game-moves-panel">
                    <div className="power-game-moves-table">
                      <span className="power-game-move-num">1.</span><span>e4</span><span>e5</span>
                      <span className="power-game-move-num">2.</span><span>Nf3</span><span>Nc6</span>
                      <span className="power-game-move-num">3.</span><span>Bb5</span><span>a6</span>
                      <span className="power-game-move-num">4.</span><span>Ba4</span><span>Nf6</span>
                      <span className="power-game-move-num">5.</span><span>O-O</span><span>Be7</span>
                      <span className="power-game-move-num">6.</span><span>Re1</span><span>b5</span>
                      <span className="power-game-move-num">7.</span><span>Bb3</span><span>d6</span>
                      <span className="power-game-move-num">8.</span><span>c3</span><span>O-O</span>
                    </div>
                    <div className="power-game-chat-wrap">
                      <div className="power-game-chat">
                        <div className="power-game-chat-msg"><b>spectator42:</b> incredible opening</div>
                        <div className="power-game-chat-msg"><b>chessking:</b> Bb5 is so solid</div>
                        <div className="power-game-chat-msg"><b>pawnstar:</b> Magnus looks sharp today</div>
                      </div>
                      <div className="power-game-chat-input">
                        <span className="power-game-chat-input-text">Send a message...</span>
                        <span className="power-game-chat-send">→</span>
                      </div>
                    </div>
                  </div>
                  <div className="power-game-player-block">
                    <div className="power-game-player-avatar" />
                    <div className="power-game-player-title">GM</div>
                    <div className="power-game-player-name">Magnus C.</div>
                    <div className="power-game-player-rating">2830</div>
                    <div className="power-game-clock power-game-clock--active">2:17</div>
                  </div>
                </div>
              </div>
            </article>

            {/* Game 2 */}
            <article className="power-card power-page-game" aria-hidden="true">
              <div className="power-chess-sidebar">
                <div className="power-chess-logo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e88a2d" strokeWidth="2">
                    <path d="M12 2L9 7H6L8 12H5L7 17H17L19 12H16L18 7H15L12 2Z" />
                    <rect x="7" y="17" width="10" height="3" rx="1" />
                  </svg>
                  <span className="power-chess-logo-text">Play</span>
                </div>
                <nav className="power-chess-nav">
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
                    Home
                  </div>
                  <div className="power-chess-nav-item power-chess-nav-item--active">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                    Play
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Puzzles
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    Learn
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    Watch
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v18M18 3v18M6 9h12M6 15h12M3 6h3M18 6h3M3 18h3M18 18h3"/></svg>
                    Tournaments
                  </div>
                </nav>
                <div className="power-chess-nav-divider" />
                <div className="power-chess-nav-label">Community</div>
                <nav className="power-chess-nav power-chess-nav--community">
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    Friends
                    <span className="power-chess-notif-dot" />
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Messages
                  </div>
                  <div className="power-chess-nav-item">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    Notifications
                  </div>
                </nav>
                <div className="power-chess-profile">
                  <div className="power-chess-avatar" />
                  <span className="power-chess-profile-name">Guest</span>
                </div>
              </div>
              <div className="power-game-main">
                <div className="power-game-board">
                  <div className="power-game-grid">
                    {GAME2.map((piece, i) => {
                      const row = Math.floor(i / 8)
                      const col = i % 8
                      const isLight = (row + col) % 2 === 0
                      return <div key={i} className={`power-game-square ${isLight ? 'power-game-square--light' : 'power-game-square--dark'}`}>{piece && PIECE[piece] && <img src={PIECE[piece]} alt="" className="power-game-piece" />}</div>
                    })}
                  </div>
                </div>
                <div className="power-game-panel">
                  <div className="power-game-player-block">
                    <div className="power-game-player-avatar" />
                    <div className="power-game-player-title">GM</div>
                    <div className="power-game-player-name">Ding Liren</div>
                    <div className="power-game-player-rating">2780</div>
                    <div className="power-game-clock">4:31</div>
                  </div>
                  <div className="power-game-moves-panel">
                    <div className="power-game-moves-table">
                      <span className="power-game-move-num">1.</span><span>d4</span><span>Nf6</span>
                      <span className="power-game-move-num">2.</span><span>c4</span><span>e6</span>
                      <span className="power-game-move-num">3.</span><span>Nf3</span><span>d5</span>
                      <span className="power-game-move-num">4.</span><span>Nc3</span><span>Be7</span>
                      <span className="power-game-move-num">5.</span><span>Bf4</span><span>O-O</span>
                      <span className="power-game-move-num">6.</span><span>e3</span><span>Nbd7</span>
                      <span className="power-game-move-num">7.</span><span>Be2</span><span>c5</span>
                      <span className="power-game-move-num">8.</span><span>O-O</span><span>b6</span>
                    </div>
                    <div className="power-game-chat-wrap">
                      <div className="power-game-chat">
                        <div className="power-game-chat-msg"><b>gmfan99:</b> classic QGD</div>
                        <div className="power-game-chat-msg"><b>endgame_pro:</b> Ding playing solid</div>
                        <div className="power-game-chat-msg"><b>rookiev:</b> this could be a draw</div>
                      </div>
                      <div className="power-game-chat-input">
                        <span className="power-game-chat-input-text">Send a message...</span>
                        <span className="power-game-chat-send">→</span>
                      </div>
                    </div>
                  </div>
                  <div className="power-game-player-block">
                    <div className="power-game-player-avatar" />
                    <div className="power-game-player-title">GM</div>
                    <div className="power-game-player-name">Fabiano C.</div>
                    <div className="power-game-player-rating">2766</div>
                    <div className="power-game-clock power-game-clock--active">6:08</div>
                  </div>
                </div>
              </div>
            </article>

            {/* End Pages */}
            <article className="power-card power-page-end power-gap-5x">
              <img src="/power-end-1.jpg" alt="" className="power-end-img" />
            </article>

            <article className="power-card power-page-end">
              <img src="/power-end-2.jpg" alt="" className="power-end-img" />
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PowerPage
