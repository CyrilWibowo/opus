import React, { useState, useEffect, useRef, useCallback } from 'react'
import DeathPage from './DeathPage'
import WonderPage from './WonderPage'
import PowerPage from './PowerPage'
import LovePage from './LovePage'
import FaithPage from './FaithPage'

const projectTitles = {
  wonder: { title: 'Astra Regunt', subtitle: 'Wonder | 奇' },
  power: { title: 'Sine Metu', subtitle: 'Power | 力' },
  death: { title: 'Mors Vincit Omnia', subtitle: 'Death | 死' },
  love: { title: 'Ex Animo', subtitle: 'Love | 爱' },
  faith: { title: 'Fides et Ratio', subtitle: 'Faith | 信' },
}

function App() {
  const [page, setPage] = useState('home')
  const [transitioning, setTransitioning] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [aboutScrollY, setAboutScrollY] = useState(0)
  const [sectionExit, setSectionExit] = useState(-1)
  const [expandedProject, setExpandedProject] = useState(null)
  const [showDeathPage, setShowDeathPage] = useState(false)
  const [showWonderPage, setShowWonderPage] = useState(false)
  const [showPowerPage, setShowPowerPage] = useState(false)
  const [showLovePage, setShowLovePage] = useState(false)
  const [showFaithPage, setShowFaithPage] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const skipPopState = useRef(false)
  const projects = [
    { id: 'wonder', img: '/wonder-thumbnail.jpg' },
    { id: 'power', img: '/power-thumbnail.jpg' },
    { id: 'death', img: '/death-thumbnail.jpg' },
    { id: 'love', img: '/love-thumbnail.jpg' },
    { id: 'faith', img: '/faith-thumbnail.jpg' },
  ]
  const trackRef = useRef(null)
  const trackMouseDownAt = useRef(0)
  const trackPrevPercentage = useRef(0)
  const trackPercentage = useRef(0)
  const wheelVelocity = useRef(0)
  const wheelLastClientX = useRef(0)
  const wheelLastTime = useRef(0)
  const wheelRafId = useRef(null)
  const wheelDragging = useRef(false)
  const wheelCenter = useRef({ x: 0, y: 0 })
  const wheelExpanded = useRef(false)
  const wheelCollapsing = useRef(false)
  const projectsVisited = useRef(false)
  const cycling = useRef(false)
  const expListRef = useRef(null)
  const expRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const aboutMaxScroll = useRef(0)
  const expPos = useRef(0)
  const expVelocity = useRef(0)
  const expRaf = useRef(null)
  const expDragging = useRef(false)
  const expDragLastY = useRef(0)
  const expDragLastTime = useRef(0)
  const expDragVelocity = useRef(0)
  const expandedProjectRef = useRef(null)
  const showDeathPageRef = useRef(false)
  const showWonderPageRef = useRef(false)
  const showPowerPageRef = useRef(false)
  const showLovePageRef = useRef(false)
  const showFaithPageRef = useRef(false)
  const navigatingRef = useRef(false)

  useEffect(() => {
    expandedProjectRef.current = expandedProject
  }, [expandedProject])

  useEffect(() => {
    showDeathPageRef.current = showDeathPage
  }, [showDeathPage])

  useEffect(() => {
    showWonderPageRef.current = showWonderPage
  }, [showWonderPage])

  useEffect(() => {
    showPowerPageRef.current = showPowerPage
  }, [showPowerPage])

  useEffect(() => {
    showLovePageRef.current = showLovePage
  }, [showLovePage])

  useEffect(() => {
    showFaithPageRef.current = showFaithPage
  }, [showFaithPage])

  const pushUrl = useCallback((path) => {
    if (window.location.pathname !== path) {
      skipPopState.current = true
      window.history.pushState(null, '', path)
    }
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      if (skipPopState.current) {
        skipPopState.current = false
        return
      }
      const path = window.location.pathname.replace(/^\/+/, '')
      const projectIds = ['death', 'wonder', 'power', 'love', 'faith']
      if (projectIds.includes(path)) {
        // If already on projects page with this project open, just close the sub-page overlay
        if (page === 'projects' && expandedProject === path) {
          setShowDeathPage(false)
          setShowWonderPage(false)
          setShowPowerPage(false)
          setShowLovePage(false)
          setShowFaithPage(false)
        }
      } else if (path === 'about') {
        if (page !== 'about') switchPage('about')
      } else {
        // Root — close any open sub-pages and go to projects
        setShowDeathPage(false)
        setShowWonderPage(false)
        setShowPowerPage(false)
        setShowLovePage(false)
        setShowFaithPage(false)
        if (page === 'about') switchPage('projects')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [page, expandedProject])

  // On initial load, route based on URL
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '')
    if (path === 'about') {
      setPage('about')
      setTransitioning(true)
      setTimeout(() => setShowContent(true), 50)
    }
  }, [])

  // Update document title based on current page
  useEffect(() => {
    const projectNames = { wonder: 'Wonder', power: 'Power', death: 'Death', love: 'Love', faith: 'Faith' }
    if (page === 'about') {
      document.title = 'About'
    } else if (showDeathPage || showWonderPage || showPowerPage || showLovePage || showFaithPage) {
      const active = showDeathPage ? 'death' : showWonderPage ? 'wonder' : showPowerPage ? 'power' : showLovePage ? 'love' : 'faith'
      document.title = `${projectTitles[active].title}, ${projectNames[active]}`
    } else {
      document.title = 'Cyril Wibowo'
    }
  }, [page, showDeathPage, showWonderPage, showPowerPage, showLovePage, showFaithPage])

  const tickExp = useCallback(() => {
    if (cycling.current) {
      expRaf.current = null
      return
    }
    if (!expDragging.current) {
      const speed = Math.abs(expVelocity.current)
      const friction = speed < 0.3 ? 0.88 : 0.94
      expPos.current += expVelocity.current
      expVelocity.current *= friction

      if (expPos.current < 0) {
        expPos.current += (0 - expPos.current) * 0.08
        expVelocity.current *= 0.3
      } else if (expPos.current > aboutMaxScroll.current) {
        expPos.current += (aboutMaxScroll.current - expPos.current) * 0.08
        expVelocity.current *= 0.3
      }

      if (Math.abs(expVelocity.current) < 0.02 && expPos.current >= 0 && expPos.current <= aboutMaxScroll.current) {
        expVelocity.current = 0
        setAboutScrollY(Math.max(0, Math.min(aboutMaxScroll.current, expPos.current)))
        expRaf.current = null
        return
      }
    }

    setAboutScrollY(Math.max(0, Math.min(aboutMaxScroll.current, expPos.current)))
    expRaf.current = requestAnimationFrame(tickExp)
  }, [])

  const startTick = useCallback(() => {
    if (!expRaf.current) {
      expRaf.current = requestAnimationFrame(tickExp)
    }
  }, [tickExp])

  useEffect(() => {
    if (page !== 'about') return
    const updateMaxScroll = () => {
      if (expListRef.current) {
        const contentHeight = expListRef.current.scrollHeight
        const viewHeight = expListRef.current.parentElement?.offsetHeight || window.innerHeight
        aboutMaxScroll.current = Math.max(0, contentHeight - viewHeight)
      }
    }
    updateMaxScroll()
    window.addEventListener('resize', updateMaxScroll)
    return () => window.removeEventListener('resize', updateMaxScroll)
  }, [page, showContent])

  const handleExpWheel = useCallback((e) => {
    e.preventDefault()
    if (cycling.current) return
    expVelocity.current += e.deltaY * 0.08
    startTick()
  }, [startTick])

  const handleDragStart = useCallback((e) => {
    if (cycling.current) return
    expDragging.current = true
    const y = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    expDragLastY.current = y
    expDragLastTime.current = Date.now()
    expDragVelocity.current = 0
    expVelocity.current = 0
    startTick()
  }, [startTick])

  const handleDragMove = useCallback((e) => {
    if (!expDragging.current) return
    e.preventDefault()
    const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    const now = Date.now()
    const deltaY = expDragLastY.current - y
    const deltaTime = Math.max(1, now - expDragLastTime.current)

    expDragVelocity.current = (deltaY / deltaTime) * 5
    expPos.current += deltaY * 1.5

    expDragLastY.current = y
    expDragLastTime.current = now
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!expDragging.current) return
    expDragging.current = false
    expVelocity.current = expDragVelocity.current
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
      if (expRaf.current) cancelAnimationFrame(expRaf.current)
    }
  }, [handleDragMove, handleDragEnd])

  const getActiveAboutSection = () => {
    if (!expListRef.current?.parentElement) return 'me'
    const containerHeight = expListRef.current.parentElement.offsetHeight
    const viewCenter = containerHeight / 2
    // Find which section group is closest to center
    // "me" = expRefs[0], "experience" = expRefs[1]+expRefs[2], "contact" = expRefs[3]
    const groups = [
      { key: 'me', indices: [0] },
      { key: 'experience', indices: [1, 2] },
      { key: 'contact', indices: [3] },
    ]
    let closest = 'me'
    let closestDist = Infinity
    for (const group of groups) {
      for (const idx of group.indices) {
        const ref = expRefs[idx]
        if (!ref.current) continue
        const sectionCenter = ref.current.offsetTop + ref.current.offsetHeight / 2 - aboutScrollY
        const dist = Math.abs(sectionCenter - viewCenter)
        if (dist < closestDist) {
          closestDist = dist
          closest = group.key
        }
      }
    }
    return closest
  }

  const activeAboutSection = getActiveAboutSection()

  const isSubPage = page !== 'home'

  // Preload & pre-decode wheel images during home screen
  useEffect(() => {
    if (page !== 'home') return
    projects.forEach((p) => {
      const img = new Image()
      img.src = p.img
      img.decode?.().catch(() => {})
    })
  }, [])

  // Auto-transition from home to projects
  useEffect(() => {
    if (page !== 'home') return
    const timer = setTimeout(() => {
      navigateTo('projects')
    }, 3000)
    return () => clearTimeout(timer)
  }, [page])

  // Wheel geometry
  const sliceAngle = 360 / projects.length
  const wheelImgsRef = useRef([])

  const buildWedge = (cx, cy, r, centerAngle, halfAngle, steps) => {
    const sRad = (centerAngle - halfAngle) * Math.PI / 180
    const eRad = (centerAngle + halfAngle) * Math.PI / 180
    const range = eRad - sRad
    let s = `${cx + 0.5 | 0}px ${cy + 0.5 | 0}px`
    for (let j = 0; j <= steps; j++) {
      const a = sRad + range * (j / steps)
      s += `,${(cx + r * Math.sin(a)) + 0.5 | 0}px ${(cy - r * Math.cos(a)) + 0.5 | 0}px`
    }
    return `polygon(${s})`
  }

  const applyWheelTransform = useCallback((rotation) => {
    const imgs = wheelImgsRef.current
    if (!imgs.length) return
    const { x: cx, y: cy } = wheelCenter.current
    const r = Math.max(window.innerWidth, window.innerHeight) * 2
    const halfAngle = sliceAngle / 2
    for (let i = 0; i < imgs.length; i++) {
      const centerAngle = rotation + i * sliceAngle
      imgs[i].style.clipPath = buildWedge(cx, cy, r, centerAngle, halfAngle, 8)
    }
  }, [sliceAngle])

  const expandImageRef = useRef(null)

  const expandImage = useCallback((index) => {
    const expandStart = performance.now()
    const expandDuration = 1800
    const imgs = wheelImgsRef.current
    if (!imgs.length) return
    const { x: cx, y: cy } = wheelCenter.current
    const rr = Math.max(window.innerWidth, window.innerHeight) * 2
    const baseHalf = sliceAngle / 2
    const rotation = trackPercentage.current

    // Set expanded project immediately when animation starts
    const n = projects.length
    const centeredIndex = Math.round((((-rotation / sliceAngle) % n) + n) % n) % n
    setExpandedProject(projects[centeredIndex].id)

    // Put expanding image on top so both edges are visible
    for (let i = 0; i < imgs.length; i++) {
      imgs[i].style.zIndex = i === index ? 2 : 1
    }

    const animateExpand = () => {
      const elapsed = performance.now() - expandStart
      const progress = Math.min(elapsed / expandDuration, 1)
      const eased = progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      for (let i = 0; i < imgs.length; i++) {
        const cAngle = rotation + i * sliceAngle
        if (i === index) {
          const half = baseHalf + (180 - baseHalf) * eased
          imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 10)
        } else {
          const half = baseHalf * (1 - eased)
          if (half < 0.5) {
            imgs[i].style.clipPath = 'polygon(0 0,0 0,0 0)'
          } else {
            imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 6)
          }
        }
      }

      if (progress < 1) {
        wheelRafId.current = requestAnimationFrame(animateExpand)
      } else {
        wheelExpanded.current = true
        wheelRafId.current = null
      }
    }
    wheelRafId.current = requestAnimationFrame(animateExpand)
  }, [sliceAngle])

  expandImageRef.current = expandImage

  // Smooth snap to nearest slice center, then expand
  const snapThenExpand = useCallback((fromRotation) => {
    const snapped = Math.round(fromRotation / sliceAngle) * sliceAngle
    const delta = snapped - fromRotation
    if (Math.abs(delta) < 0.1) {
      trackPercentage.current = snapped
      trackPrevPercentage.current = snapped
      applyWheelTransform(snapped)
      const n = projects.length
      const centeredIndex = Math.round((((-snapped / sliceAngle) % n) + n) % n) % n
      expandImageRef.current(centeredIndex)
      return
    }
    const snapStart = performance.now()
    const snapDuration = 500
    const animateSnap = () => {
      const elapsed = performance.now() - snapStart
      const progress = Math.min(elapsed / snapDuration, 1)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      const current = fromRotation + delta * eased
      trackPercentage.current = current
      applyWheelTransform(current)
      if (progress < 1) {
        wheelRafId.current = requestAnimationFrame(animateSnap)
      } else {
        trackPercentage.current = snapped
        trackPrevPercentage.current = snapped
        applyWheelTransform(snapped)
        const n = projects.length
        const centeredIndex = Math.round((((-snapped / sliceAngle) % n) + n) % n) % n
        expandImageRef.current(centeredIndex)
      }
    }
    wheelRafId.current = requestAnimationFrame(animateSnap)
  }, [sliceAngle, applyWheelTransform])

  const tickWheel = useCallback(() => {
    wheelVelocity.current *= 0.985
    trackPercentage.current += wheelVelocity.current
    applyWheelTransform(trackPercentage.current)
    if (Math.abs(wheelVelocity.current) > 0.001) {
      wheelRafId.current = requestAnimationFrame(tickWheel)
    } else {
      wheelVelocity.current = 0
      snapThenExpand(trackPercentage.current)
    }
  }, [applyWheelTransform, snapThenExpand])

  // Collapse expanded image back to wheel
  const collapseImage = useCallback(() => {
    setExpandedProject(null)
    wheelCollapsing.current = true
    wheelExpanded.current = false
    const collapseStart = performance.now()
    const collapseDuration = 400
    const imgs = wheelImgsRef.current
    if (!imgs.length) { wheelCollapsing.current = false; return }
    const { x: cx, y: cy } = wheelCenter.current
    const rr = Math.max(window.innerWidth, window.innerHeight) * 2
    const baseHalf = sliceAngle / 2
    const rotation = trackPercentage.current
    const n = projects.length
    const expandedIndex = Math.round((((-rotation / sliceAngle) % n) + n) % n) % n

    const animateCollapse = () => {
      const elapsed = performance.now() - collapseStart
      const progress = Math.min(elapsed / collapseDuration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)

      for (let i = 0; i < imgs.length; i++) {
        const cAngle = rotation + i * sliceAngle
        if (i === expandedIndex) {
          const half = 180 - (180 - baseHalf) * eased
          imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 10)
        } else {
          const half = baseHalf * eased
          if (half < 0.5) {
            imgs[i].style.clipPath = 'polygon(0 0,0 0,0 0)'
          } else {
            imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 6)
          }
        }
      }

      if (progress < 1) {
        wheelRafId.current = requestAnimationFrame(animateCollapse)
      } else {
        for (let i = 0; i < imgs.length; i++) imgs[i].style.zIndex = 1
        wheelCollapsing.current = false
        wheelRafId.current = null
      }
    }
    wheelRafId.current = requestAnimationFrame(animateCollapse)
  }, [sliceAngle])

  const navigateToProject = useCallback((direction) => {
    if (navigatingRef.current || !wheelExpanded.current) return
    navigatingRef.current = true

    const imgs = wheelImgsRef.current
    if (!imgs.length) { navigatingRef.current = false; return }
    const { x: cx, y: cy } = wheelCenter.current
    const rr = Math.max(window.innerWidth, window.innerHeight) * 2
    const baseHalf = sliceAngle / 2
    const rotation = trackPercentage.current
    const n = projects.length
    const expandedIndex = Math.round((((-rotation / sliceAngle) % n) + n) % n) % n
    const targetRotation = rotation - direction * sliceAngle

    // Phase 1: Collapse (0-400ms)
    setExpandedProject(null)
    wheelExpanded.current = false
    const phase1Start = performance.now()
    const phase1Duration = 400

    const animatePhase1 = () => {
      const elapsed = performance.now() - phase1Start
      const progress = Math.min(elapsed / phase1Duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)

      for (let i = 0; i < imgs.length; i++) {
        const cAngle = rotation + i * sliceAngle
        if (i === expandedIndex) {
          const half = 180 - (180 - baseHalf) * eased
          imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 10)
        } else {
          const half = baseHalf * eased
          if (half < 0.5) {
            imgs[i].style.clipPath = 'polygon(0 0,0 0,0 0)'
          } else {
            imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, half, 6)
          }
        }
      }

      if (progress < 1) {
        wheelRafId.current = requestAnimationFrame(animatePhase1)
      } else {
        for (let i = 0; i < imgs.length; i++) imgs[i].style.zIndex = 1
        // Phase 2: Rotate (400-900ms)
        const phase2Start = performance.now()
        const phase2Duration = 500
        const startRotation = rotation

        const animatePhase2 = () => {
          const elapsed = performance.now() - phase2Start
          const progress = Math.min(elapsed / phase2Duration, 1)
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          const current = startRotation + (targetRotation - startRotation) * eased
          trackPercentage.current = current
          applyWheelTransform(current)

          if (progress < 1) {
            wheelRafId.current = requestAnimationFrame(animatePhase2)
          } else {
            trackPercentage.current = targetRotation
            trackPrevPercentage.current = targetRotation
            applyWheelTransform(targetRotation)
            // Phase 3: Expand new centered thumbnail
            const newIndex = Math.round((((-targetRotation / sliceAngle) % n) + n) % n) % n
            navigatingRef.current = false
            expandImageRef.current(newIndex)
          }
        }
        wheelRafId.current = requestAnimationFrame(animatePhase2)
      }
    }

    if (wheelRafId.current) {
      cancelAnimationFrame(wheelRafId.current)
      wheelRafId.current = null
    }
    wheelRafId.current = requestAnimationFrame(animatePhase1)
  }, [sliceAngle, applyWheelTransform])

  const handleCloseProject = useCallback(() => {
    pushUrl('/')
    setExpandedProject(null)
    setShowDeathPage(false)
    setShowWonderPage(false)
    setShowPowerPage(false)
    setShowLovePage(false)
    setShowFaithPage(false)
    if (wheelRafId.current) {
      cancelAnimationFrame(wheelRafId.current)
      wheelRafId.current = null
    }
    collapseImage()
  }, [collapseImage])

  // Image track drag handlers
  const handleTrackDown = useCallback((e) => {
    // Don't collapse if a full sub-page is open — it has its own close button
    if (showDeathPageRef.current || showWonderPageRef.current || showPowerPageRef.current || showLovePageRef.current || showFaithPageRef.current) return
    if (wheelExpanded.current) {
      if (wheelRafId.current) {
        cancelAnimationFrame(wheelRafId.current)
        wheelRafId.current = null
      }
      collapseImage()
      return
    }
    if (wheelCollapsing.current) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    if (wheelRafId.current) {
      cancelAnimationFrame(wheelRafId.current)
      wheelRafId.current = null
    }
    // Clear title from a cancelled expand animation
    if (expandedProjectRef.current) {
      setExpandedProject(null)
    }
    trackMouseDownAt.current = clientX
    wheelLastClientX.current = clientX
    wheelLastTime.current = Date.now()
    trackPrevPercentage.current = trackPercentage.current
    wheelDragging.current = true
    wheelVelocity.current = 0
  }, [collapseImage])

  const handleTrackUp = useCallback(() => {
    if (!wheelDragging.current) return
    trackMouseDownAt.current = 0
    wheelDragging.current = false
    trackPrevPercentage.current = trackPercentage.current
    if (Math.abs(wheelVelocity.current) > 0.001) {
      wheelRafId.current = requestAnimationFrame(tickWheel)
    } else {
      snapThenExpand(trackPercentage.current)
    }
  }, [tickWheel, snapThenExpand])

  const handleTrackMove = useCallback((e) => {
    if (trackMouseDownAt.current === 0 || wheelCollapsing.current) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const now = Date.now()

    const mouseDelta = clientX - trackMouseDownAt.current
    const degreesPerPixel = 0.3
    const newRotation = trackPrevPercentage.current + mouseDelta * degreesPerPixel
    trackPercentage.current = newRotation

    const dt = Math.max(1, now - wheelLastTime.current)
    wheelVelocity.current = ((clientX - wheelLastClientX.current) * degreesPerPixel) / dt * 16
    wheelLastClientX.current = clientX
    wheelLastTime.current = now

    applyWheelTransform(newRotation)
  }, [applyWheelTransform])

  const computeWheelCenter = useCallback(() => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }, [])

  useEffect(() => {
    if (page !== 'projects') return
    // Cache image DOM elements
    const container = trackRef.current?.closest('[data-wheel-root]')
    if (container) {
      wheelImgsRef.current = Array.from(container.querySelectorAll('.wheel-image'))
    }
    trackMouseDownAt.current = 0
    trackPrevPercentage.current = trackPercentage.current
    requestAnimationFrame(() => {
      computeWheelCenter()

      if (!projectsVisited.current) {
        projectsVisited.current = true
        applyWheelTransform(trackPercentage.current)
        const spinStart = Date.now()
        const spinDuration = 2000
        const animateSpin = () => {
          const elapsed = Date.now() - spinStart
          const progress = Math.min(elapsed / spinDuration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          const rotation = 360 * eased
          trackPercentage.current = rotation
          applyWheelTransform(rotation)
          if (progress < 1) {
            wheelRafId.current = requestAnimationFrame(animateSpin)
          } else {
            trackPercentage.current = 0
            trackPrevPercentage.current = 0
            applyWheelTransform(0)
            expandImage(0)
          }
        }
        wheelRafId.current = requestAnimationFrame(animateSpin)
      } else {
        const rotation = trackPercentage.current
        const n = projects.length
        const centeredIndex = Math.round((((-rotation / sliceAngle) % n) + n) % n) % n
        const imgs = wheelImgsRef.current
        if (imgs.length) {
          const { x: cx, y: cy } = wheelCenter.current
          const rr = Math.max(window.innerWidth, window.innerHeight) * 2
          for (let i = 0; i < imgs.length; i++) {
            const cAngle = rotation + i * sliceAngle
            if (i === centeredIndex) {
              imgs[i].style.zIndex = 2
              imgs[i].style.clipPath = buildWedge(cx, cy, rr, cAngle, 180, 12)
            } else {
              imgs[i].style.zIndex = 1
              imgs[i].style.clipPath = 'polygon(0 0,0 0,0 0)'
            }
          }
          wheelExpanded.current = true
          setExpandedProject(projects[centeredIndex].id)
        }
      }
    })

    const onDown = (e) => handleTrackDown(e)
    const onUp = () => handleTrackUp()
    const onMove = (e) => handleTrackMove(e)

    const onResize = () => {
      computeWheelCenter()
      applyWheelTransform(trackPercentage.current)
    }

    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onDown)
    window.addEventListener('touchend', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onDown)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('resize', onResize)
      if (wheelRafId.current) cancelAnimationFrame(wheelRafId.current)
    }
  }, [page, handleTrackDown, handleTrackUp, handleTrackMove, applyWheelTransform, computeWheelCenter, tickWheel])

  const navigateTo = (newPage) => {
    setTransitioning(true)
    setShowContent(false)

    setTimeout(() => {
      setPage(newPage)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShowContent(true)
        })
      })
    }, 1000)
  }

  const goHome = () => {
    pushUrl('/')
    setShowContent(false)

    setTimeout(() => {
      setPage('home')
      setTransitioning(false)
      setAboutScrollY(0)
      expPos.current = 0
      expVelocity.current = 0
    }, 300)
  }

  const sectionCount = 6

  const switchPage = (targetPage) => {
    if (targetPage === page) return
    if (targetPage === 'home') { goHome(); return }
    pushUrl(targetPage === 'about' ? '/about' : '/')
    if (!isSubPage) { navigateTo(targetPage); return }

    if (cycling.current) return
    cycling.current = true

    const onExitDone = () => {
      expVelocity.current = 0
      setSectionExit(-1)
      setPage(targetPage)
      setAboutScrollY(0)
      expPos.current = 0
      setShowContent(false)

      setTimeout(() => {
        setShowContent(true)
        cycling.current = false
      }, 50)
    }

    if (page === 'about') {
      const staggerDelay = 100
      for (let i = 0; i < sectionCount; i++) {
        setTimeout(() => setSectionExit(i), i * staggerDelay)
      }
      setTimeout(onExitDone, sectionCount * staggerDelay + 400)
    } else {
      setShowContent(false)
      setTimeout(onExitDone, 400)
    }
  }

  const getSectionExitStyle = (sectionIndex) => {
    const exiting = sectionExit >= sectionIndex
    return {
      transform: exiting ? 'translateX(60px)' : 'translateX(0)',
      opacity: exiting ? 0 : undefined,
      transition: 'transform 0.5s ease-in, opacity 0.5s ease-in',
    }
  }

  return (
    <div className={`min-h-screen bg-[#090909] overflow-x-hidden ${isSubPage && page !== 'projects' ? 'overflow-y-auto' : 'overflow-hidden'}`}>

      {/* Home - Landing */}
      <div
        className={`fixed inset-0 flex items-center justify-center p-8 transition-all duration-1000 ${transitioning || isSubPage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <p className="text-white/80 text-4xl md:text-5xl font-semibold leading-snug tracking-tight text-center max-w-2xl">
          What is your reason for what you do?
        </p>
      </div>

      {/* Sub-pages shared layout */}
      <div
        className={`fixed inset-0 pt-16 ${page !== 'about' ? 'pb-16' : 'pb-0'} px-8 select-none z-10 ${isSubPage ? '' : 'pointer-events-none'}`}
        style={{ opacity: isSubPage ? 1 : 0, transition: 'opacity 0.5s ease' }}
        onMouseDown={page === 'about' ? handleDragStart : undefined}
        onTouchStart={page === 'about' ? handleDragStart : undefined}
        onWheel={page === 'about' ? handleExpWheel : undefined}
      >
        {/* Nav bar */}
        <div className="relative z-20 flex items-center justify-center gap-12 mb-10" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <button
            onClick={() => switchPage('projects')}
            className={`text-base tracking-wider transition-all duration-500 cursor-pointer ${page === 'projects' ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
          >
            projects
          </button>
          <button
            onClick={() => switchPage('about')}
            className={`text-base tracking-wider transition-all duration-500 cursor-pointer ${page === 'about' ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
          >
            about
          </button>
        </div>

        {/* Sliding content area */}
        <div
          className="max-w-6xl mx-auto"
          style={{
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {/* About */}
          {page === 'about' && (
            <div
              className="relative overflow-hidden"
              style={{ height: 'calc(100vh - 10rem)' }}
            >
              {/* Contents list */}
              <div
                className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 transition-opacity duration-500"
                style={{ opacity: sectionExit >= 0 ? 0 : 1 }}
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    const target = expRefs[0].current ? Math.max(0, expRefs[0].current.offsetTop + expRefs[0].current.offsetHeight / 2 - (expListRef.current?.parentElement?.offsetHeight || window.innerHeight) / 2) : 0
                    expPos.current = target; expVelocity.current = 0; setAboutScrollY(target)
                  }}
                  className={`text-xs tracking-wider text-left transition-colors duration-300 ${activeAboutSection === 'me' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                  me
                </button>
                <button
                  onClick={() => {
                    const target = expRefs[1].current ? Math.max(0, expRefs[1].current.offsetTop + expRefs[1].current.offsetHeight / 2 - (expListRef.current?.parentElement?.offsetHeight || window.innerHeight) / 2) : 0
                    expPos.current = target; expVelocity.current = 0; setAboutScrollY(target)
                  }}
                  className={`text-xs tracking-wider text-left transition-colors duration-300 ${activeAboutSection === 'experience' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                  experience
                </button>
                <button
                  onClick={() => {
                    const target = expRefs[3].current ? Math.max(0, expRefs[3].current.offsetTop + expRefs[3].current.offsetHeight / 2 - (expListRef.current?.parentElement?.offsetHeight || window.innerHeight) / 2) : 0
                    expPos.current = target; expVelocity.current = 0; setAboutScrollY(target)
                  }}
                  className={`text-xs tracking-wider text-left transition-colors duration-300 ${activeAboutSection === 'contact' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                  contact
                </button>
              </div>
              <div
                ref={expListRef}
                style={{
                  transform: `translateY(${-aboutScrollY}px)`,
                  paddingLeft: 'calc(10% + 10vw)',
                  paddingTop: 'calc((100vh - 10rem) / 2 - 10vh)',
                  paddingBottom: 'calc((100vh - 10rem) / 2 - 10vh)',
                  willChange: 'transform',
                }}
              >
                {/* Bio part 1 */}
                <div
                  className="text-left"
                  style={{ ...getSectionExitStyle(0), opacity: sectionExit >= 0 ? 0 : 1 }}
                  ref={expRefs[0]}
                >
                  <p className="text-white text-5xl font-semibold mb-8 leading-relaxed">
                    I am a Full Stack Developer and Software Engineer graduating from the University of New South Wales.
                  </p>
                </div>

                {/* Bio part 2 */}
                <div
                  className="text-left pb-32"
                  style={{ ...getSectionExitStyle(1), opacity: sectionExit >= 1 ? 0 : 1 }}
                >
                  <p className="text-white text-5xl font-semibold mb-8 leading-relaxed">
                    I specialise in building web apps, always
                    looking to expand my skills and create experiences worth remembering.
                  </p>
                </div>

                {/* Working Experience heading */}
                <div style={{ ...getSectionExitStyle(2), opacity: sectionExit >= 2 ? 0 : 1 }}>
                  <h3 className="text-white text-5xl font-semibold mb-16">Working Experience</h3>
                </div>

                {/* Experience: Freelance */}
                <div
                  className="pb-16 pl-20"
                  style={{ ...getSectionExitStyle(3), opacity: sectionExit >= 3 ? 0 : 1 }}
                  ref={expRefs[1]}
                >
                  <h3 className="text-white font-semibold text-4xl mb-3">Freelance Full Stack & Web Developer</h3>
                  <p className="text-neutral-600 text-xl">2025 — Present</p>
                </div>

                {/* Experience: Consulting */}
                <div
                  className="pl-20"
                  style={{ ...getSectionExitStyle(4), opacity: sectionExit >= 4 ? 0 : 1 }}
                  ref={expRefs[2]}
                >
                  <h3 className="text-white font-semibold text-4xl mb-3">Consulting & Technology Intern</h3>
                  <p className="text-white text-4xl font-semibold">Gate Gourmet</p>
                  <p className="text-neutral-600 text-xl mt-1">Jan 2025 — Feb 2025</p>
                </div>

                {/* Socials */}
                <div
                  className="pt-32"
                  style={{ ...getSectionExitStyle(5), opacity: sectionExit >= 5 ? 0 : 1 }}
                  ref={expRefs[3]}
                >
                  <h3 className="text-white text-5xl font-semibold mb-16">Get in Touch</h3>
                  <div className="flex gap-12 pl-20 relative">
                    <a href="https://www.facebook.com/cyril.wibowo.37/" target="_blank" rel="noopener noreferrer" className="group" aria-label="Facebook">
                      <svg className="w-12 h-12 fill-neutral-600 transition-all duration-700 group-hover:fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a href="https://github.com/CyrilWibowo" target="_blank" rel="noopener noreferrer" className="group" aria-label="GitHub">
                      <svg className="w-12 h-12 fill-neutral-600 transition-all duration-700 group-hover:fill-white" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/cyril-wibowo-799712265/" target="_blank" rel="noopener noreferrer" className="group" aria-label="LinkedIn">
                      <svg className="w-12 h-12 fill-neutral-600 transition-all duration-700 group-hover:fill-[#0A66C2]" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <button
                      className="group cursor-pointer bg-transparent border-none p-0"
                      aria-label="Copy email"
                      onClick={() => {
                        navigator.clipboard.writeText('cd.wibowo@gmail.com')
                        setEmailCopied(true)
                        setTimeout(() => setEmailCopied(false), 2000)
                      }}
                    >
                      <svg className="w-12 h-12 fill-neutral-600 transition-all duration-700 group-hover:fill-white" viewBox="0 0 24 24">
                        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wheel for projects */}
      {page === 'projects' && (
        <div
          data-wheel-root
          style={{
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {projects.map((p) => (
            <img
              key={p.id}
              className="wheel-image"
              src={p.img}
              decoding="async"
              draggable={false}
            />
          ))}
          <div className="wheel-container">
            <div ref={trackRef} className="wheel" />
          </div>
          <div className={`wheel-crosshair ${expandedProject ? 'wheel-crosshair--hidden' : ''}`}>
            <div className="wheel-crosshair-h" />
            <div className="wheel-crosshair-v" />
          </div>
          {expandedProject && projectTitles[expandedProject] && (
            <div
              className={`death-title-overlay ${(expandedProject === 'death' && showDeathPage) || (expandedProject === 'wonder' && showWonderPage) || (expandedProject === 'power' && showPowerPage) || (expandedProject === 'love' && showLovePage) || (expandedProject === 'faith' && showFaithPage) ? 'death-title-overlay--hidden' : ''}`}
            >
              <h1
                className="death-title-text death-title-clickable"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={
                  expandedProject === 'death' ? () => { pushUrl('/death'); setShowDeathPage(true) } :
                  expandedProject === 'wonder' ? () => { pushUrl('/wonder'); setShowWonderPage(true) } :
                  expandedProject === 'power' ? () => { pushUrl('/power'); setShowPowerPage(true) } :
                  expandedProject === 'love' ? () => { pushUrl('/love'); setShowLovePage(true) } :
                  expandedProject === 'faith' ? () => { pushUrl('/faith'); setShowFaithPage(true) } :
                  undefined
                }
              >
                {projectTitles[expandedProject].title}
              </h1>
              <p className="death-title-subtitle">{projectTitles[expandedProject].subtitle}</p>
            </div>
          )}
          {expandedProject === 'death' && (
            <DeathPage
              onClose={handleCloseProject}
              visible={showDeathPage}
              onBack={() => { pushUrl('/'); setShowDeathPage(false) }}
            />
          )}
          {expandedProject === 'wonder' && (
            <WonderPage
              onClose={handleCloseProject}
              visible={showWonderPage}
              onBack={() => { pushUrl('/'); setShowWonderPage(false) }}
            />
          )}
          {expandedProject === 'power' && (
            <PowerPage
              onClose={handleCloseProject}
              visible={showPowerPage}
              onBack={() => { pushUrl('/'); setShowPowerPage(false) }}
            />
          )}
          {expandedProject === 'love' && (
            <LovePage
              onClose={handleCloseProject}
              visible={showLovePage}
              onBack={() => { pushUrl('/'); setShowLovePage(false) }}
            />
          )}
          {expandedProject === 'faith' && (
            <FaithPage
              onClose={handleCloseProject}
              visible={showFaithPage}
              onBack={() => { pushUrl('/'); setShowFaithPage(false) }}
            />
          )}
          {expandedProject && !showDeathPage && !showWonderPage && !showPowerPage && !showLovePage && !showFaithPage && !navigatingRef.current && (
            <>
              <div
                className="wheel-nav-arrow wheel-nav-arrow--left"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => navigateToProject(-1)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                  <polyline points="15,4 7,12 15,20" />
                </svg>
              </div>
              <div
                className="wheel-nav-arrow wheel-nav-arrow--right"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => navigateToProject(1)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                  <polyline points="9,4 17,12 9,20" />
                </svg>
              </div>
            </>
          )}
        </div>
      )}

      {/* Email copied toast */}
      <div className={`email-toast ${emailCopied ? 'email-toast--visible' : ''}`}>
        Copied to clipboard
      </div>
    </div>
  )
}

export default App
