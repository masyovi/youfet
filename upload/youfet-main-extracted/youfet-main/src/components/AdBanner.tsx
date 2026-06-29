'use client'

import { useEffect, useRef, memo, useSyncExternalStore } from 'react'

/**
 * AdsTerra Native Banner for YouFet
 *
 * - No placeholder box
 * - If ad loads → ad positions itself
 * - If not → nothing visible (invisible)
 */

const NATIVE_ZONE_ID = 'd405c45c5756f4b6ff261630b04c16a5'
const NATIVE_SCRIPT_SRC = 'https://theoreticalassertshame.com/d405c45c5756f4b6ff261630b04c16a5/invoke.js'

const emptySubscribe = () => () => {}

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * AdNative — AdsTerra Native Banner
 * Container is truly empty, ad renders itself when available
 */
export const AdNative = memo(function AdNative() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated || !containerRef.current || !NATIVE_ZONE_ID) return

    const container = containerRef.current

    // Container div required by AdsTerra
    const adContainer = document.createElement('div')
    adContainer.id = `container-${NATIVE_ZONE_ID}`
    container.appendChild(adContainer)

    // AdsTerra script
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = NATIVE_SCRIPT_SRC
    container.appendChild(script)

    return () => {
      if (container.contains(script)) container.removeChild(script)
      if (container.contains(adContainer)) container.removeChild(adContainer)
    }
  }, [hydrated])

  if (!NATIVE_ZONE_ID) return null

  return (
    <div ref={containerRef} style={{ display: 'contents' }} />
  )
})

/**
 * AdPopunder — AdsTerra Popunder Script
 * Global, runs on every page, renders nothing to DOM
 */
export function AdPopunder() {
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated) return

    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = 'https://pl29423497.profitablecpmratenetwork.com/83/b9/76/83b97604c9fe35726c1ee47e49384b21.js'
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [hydrated])

  return null
}
