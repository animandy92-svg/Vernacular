import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { CompanionAvatar, CompanionStyle } from '../types'

export type CompanionPose = 'idle' | 'walk' | 'wave' | 'talk' | 'point' | 'carry' | 'celebrate' | 'encourage' | 'dance'
export type CompanionItem = 'book' | 'basket' | 'map' | 'star' | 'none'

const LOOKS: Record<CompanionAvatar, { skin: string; shade: string; outfit: string; trim: string }> = {
  ama: { skin: '#a95d38', shade: '#87432e', outfit: '#ed7855', trim: '#ffdb74' },
  kofi: { skin: '#82472f', shade: '#663322', outfit: '#44aaa0', trim: '#c6f0d8' },
  esi: { skin: '#693e2d', shade: '#4d2b22', outfit: '#9970d9', trim: '#ffe088' },
  kojo: { skin: '#ba7349', shade: '#995334', outfit: '#efb945', trim: '#fff0b3' },
}

interface Props {
  character: CompanionStyle
  pose?: CompanionPose
  item?: CompanionItem
  size?: number
  className?: string
  interactive?: boolean
  animated?: boolean
}

function CarriedItem({ item }: { item: CompanionItem }) {
  if (item === 'none') return null
  return <g className="toon-prop" transform="translate(164 204)">
    {item === 'star' && <path d="M0-26 7-11 23-9 11 3 14 20 0 12-15 20-12 3-24-9-7-11Z" fill="#ffcf50" stroke="#eaa13a" strokeWidth="3" />}
    {item === 'map' && <><path d="m-25-19 17-5 17 6 17-5v39l-17 5-17-6-17 5Z" fill="#fff0be" stroke="#b48a51" strokeWidth="2.5" /><path d="M-8-24v39M9-18v39" stroke="#dec888" strokeWidth="2" /><path d="M-18 5q9-23 18-6t17-4" stroke="#54a59c" strokeWidth="3" fill="none" strokeDasharray="4 3" /><path d="m12-12 9 9m0-9-9 9" stroke="#e87956" strokeWidth="3" /></>}
    {item === 'book' && <><path d="M0-17q-14-9-29-3v36q15-6 29 3 14-9 29-3v-36q-15-6-29 3Z" fill="#fff9e8" stroke="#548f95" strokeWidth="4" /><path d="M0-17v34m-21-27 13 2m-13 7 13 2m16-9 13-2m-13 11 13-2" fill="none" stroke="#bbc9b7" strokeWidth="2" /></>}
    {item === 'basket' && <><path d="M-15-10c0-28 30-28 30 0" fill="none" stroke="#9d6438" strokeWidth="5" /><path d="m-25-9 6 30h38l6-30Z" fill="#e8ac60" stroke="#b67940" strokeWidth="3" /><path d="M-20 1h40M-18 10h36M-9-8v28M3-8v28M14-8v28" stroke="#bc8149" strokeWidth="2" /></>}
  </g>
}

// Separate joints keep the face, hands, feet and carried objects connected as they move.
function Cartoon({ avatar, item }: { avatar: CompanionAvatar; item: CompanionItem }) {
  const skirt = avatar === 'ama' || avatar === 'esi'
  return <svg className="toon-art" viewBox="0 0 240 280" aria-hidden="true" focusable="false">
    <ellipse className="toon-shadow" cx="120" cy="262" rx="48" ry="8" />
    <g className="toon-body">
      <g className="toon-leg toon-leg--left"><path d="M103 200v40" className="toon-limb" /><path d="M91 235h23v19H84q-6-15 7-19" fill="#34415e" /><path d="M84 253h30" className="toon-sole" /></g>
      <g className="toon-leg toon-leg--right"><path d="M137 200v40" className="toon-limb" /><path d="M126 235h23q13 4 7 19h-30Z" fill="#34415e" /><path d="M126 253h30" className="toon-sole" /></g>
      <g className="toon-arm toon-arm--left"><path d="M88 152q-18 17-15 43" className="toon-limb" /><path d="m90 149-12 21" className="toon-sleeve" /><g className="toon-wrist"><ellipse cx="73" cy="200" rx="12" ry="14" fill="var(--toon-skin)" /><path d="m79 195 5-5" className="toon-finger" /></g></g>
      <path d={skirt ? 'M93 140q27-12 54 0l18 70q-45 13-90 0Z' : 'M93 140q27-12 54 0l10 65q-37 12-74 0Z'} fill="var(--toon-outfit)" />
      <path d="M102 138q18 22 36 0" fill="none" stroke="var(--toon-trim)" strokeWidth="8" />
      <path d="m99 167 10 10 11-10 11 10 10-10m-42 23 10 10 11-10 11 10 10-10" className="toon-pattern" />
      {!skirt && <path d="m84 205 36 3 36-3-3 18h-25l-8-10-8 10H87Z" fill="#34415e" />}
      <g className="toon-head">
        {avatar === 'ama' && <g fill="#30232a"><circle cx="77" cy="52" r="26" /><circle cx="164" cy="52" r="26" /><circle cx="120" cy="58" r="53" /></g>}
        {avatar === 'esi' && <path d="M64 112V65q-3-52 57-52 62 0 57 57v42l-27 11H91Z" fill="#2e242b" />}
        {(avatar === 'kofi' || avatar === 'kojo') && <path d="M66 83V55q0-40 55-39 51-3 53 41v26Z" fill="#30262b" />}
        <circle cx="68" cy="91" r="12" fill="var(--toon-skin)" /><circle cx="172" cy="91" r="12" fill="var(--toon-skin)" />
        <rect x="69" y="38" width="102" height="105" rx="47" fill="var(--toon-skin)" />
        <path d="M81 112q39 43 78 0-8 36-39 34-30 0-39-34" fill="var(--toon-shade)" opacity=".25" />
        {avatar === 'ama' && <><path d="M68 68q-4-45 51-43 56-2 54 44-23-3-35-22-24 25-70 21" fill="#30232a" /><path d="M82 35q38-25 77 1" fill="none" stroke="#ffda70" strokeWidth="9" /></>}
        {avatar === 'kofi' && <path d="M67 61V44q10-34 52-26l13-6q7 6 3 15 34-2 39 35l-14-11-11 6-14-14-19 11-12-11-17 17Z" fill="#30262b" />}
        {avatar === 'esi' && <><path d="M67 72q-12-57 51-57 62 0 56 61-37-3-50-30-14 23-57 26" fill="#2e242b" /><path d="M67 55q46-49 104-1" fill="none" stroke="#efb948" strokeWidth="13" /><path d="m147 23 9-18 14 17-15 12Z" fill="#edb347" /></>}
        {avatar === 'kojo' && <><path d="M65 55q0-40 54-40 43 0 52 40Z" fill="#4b9db0" /><path d="M114 16q-13 15-9 38" fill="none" stroke="#76bec9" strokeWidth="5" /><path d="M62 54q53-8 114 0l14 10q-70 8-128-1Z" fill="#347b96" /></>}
        <g className="toon-brows" fill="none" stroke="#3b282b" strokeWidth="5" strokeLinecap="round"><path d="m88 72 16-3" /><path d="m136 69 16 3" /></g>
        <g className="toon-eyes"><ellipse cx="97" cy="91" rx="13" ry="17" fill="#fffdf5" /><ellipse cx="143" cy="91" rx="13" ry="17" fill="#fffdf5" /><g className="toon-pupils" fill="#302933"><ellipse cx="100" cy="94" rx="6.5" ry="10" /><ellipse cx="140" cy="94" rx="6.5" ry="10" /><circle cx="102" cy="90" r="2.5" fill="white" /><circle cx="142" cy="90" r="2.5" fill="white" /></g></g>
        <g className="toon-happy-eyes" fill="none" stroke="#302933" strokeWidth="5" strokeLinecap="round"><path d="M86 93q10-14 22 0m24 0q11-14 22 0" /></g>
        <ellipse cx="82" cy="111" rx="9" ry="5" fill="#f48a74" opacity=".4" /><ellipse cx="158" cy="111" rx="9" ry="5" fill="#f48a74" opacity=".4" />
        <path d="m117 98-3 8h8" fill="none" stroke="var(--toon-shade)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g className="toon-mouth"><path d="M103 116q17 6 34 0-2 19-17 19t-17-19" fill="#532c30" /><path d="M106 117q14 4 28 0l-3 6h-22Z" fill="#fffdf4" /><path d="M110 131q10-9 20 0-10 7-20 0" fill="#ed8c88" /></g>
      </g>
      <g className="toon-arm toon-arm--right"><path d="M152 152q18 17 12 43" className="toon-limb" /><path d="m151 149 12 21" className="toon-sleeve" /><CarriedItem item={item} /><g className="toon-wrist"><ellipse cx="164" cy="200" rx="12" ry="14" fill="var(--toon-skin)" /><path d="m158 195-5-5" className="toon-finger" /></g></g>
    </g>
    <g className="toon-sparkles" fill="#ffd466"><path d="m40 77 4 10 11 4-11 4-4 11-4-11-11-4 11-4Z" /><path d="m203 53 4 10 11 4-11 4-4 11-4-11-11-4 11-4Z" /><circle cx="194" cy="137" r="5" fill="#82d9cd" /><circle cx="45" cy="149" r="5" fill="#ef937c" /></g>
  </svg>
}

export function Companion({ character, pose = 'idle', item = 'none', size = 180, className = '', interactive = false, animated = true }: Props) {
  const root = useRef<HTMLDivElement & HTMLButtonElement>(null)
  const [active, setActive] = useState(false)
  const [reaction, setReaction] = useState<CompanionPose | null>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef({ start: 0, moved: false, pointer: -1 })
  const taps = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!animated) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    const update = () => setActive(visible && !document.hidden && !motion.matches)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    if (root.current) observer.observe(root.current)
    motion.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    update()
    return () => { observer.disconnect(); motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', update) }
  }, [animated])

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { setReaction(null); setOffset(0); setDragging(false); clearTimeout(timer.current) }, [pose, character.avatar])

  const react = (next?: CompanionPose) => {
    if (gesture.current.moved) { gesture.current.moved = false; return }
    clearTimeout(timer.current)
    setReaction(next ?? (['wave', 'dance', 'celebrate'] as const)[taps.current++ % 3])
    timer.current = setTimeout(() => setReaction(null), 2400)
  }
  const release = (event: PointerEvent<HTMLElement>) => {
    if (gesture.current.pointer !== event.pointerId) return
    gesture.current.pointer = -1
    setDragging(false)
    setOffset(0)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const look = LOOKS[character.avatar] ?? LOOKS.ama
  const style = { width: size, '--toon-skin': look.skin, '--toon-shade': look.shade, '--toon-outfit': look.outfit, '--toon-trim': look.trim, '--toon-offset': `${offset}px` } as CSSProperties
  const currentPose = dragging ? 'walk' : reaction ?? pose
  const Root = interactive ? 'button' : 'div'
  return <Root ref={root} type={interactive ? 'button' : undefined}
    className={`companion toon toon--${currentPose} ${active && animated ? '' : 'toon--paused'} ${dragging ? 'toon--dragging' : ''} ${className}`}
    style={style} data-pose={currentPose} role={interactive ? undefined : 'img'}
    aria-label={interactive ? `Play with ${character.name}. Tap to wave or dance; drag sideways to move.` : `${character.name}, your learning companion`}
    title={interactive ? 'Tap to play · drag to move' : undefined}
    onClick={interactive ? () => react() : undefined}
    onKeyDown={interactive ? (event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); react('walk') } } : undefined}
    onPointerDown={interactive ? (event) => {
      if (!event.isPrimary || event.button !== 0) return
      gesture.current = { start: event.clientX, moved: false, pointer: event.pointerId }
      event.currentTarget.setPointerCapture(event.pointerId)
    } : undefined}
    onPointerMove={interactive ? (event) => {
      if (gesture.current.pointer !== event.pointerId) return
      const delta = event.clientX - gesture.current.start
      if (Math.abs(delta) < 8 && !gesture.current.moved) return
      gesture.current.moved = true
      const limit = event.currentTarget.clientWidth * .2
      setDragging(true)
      setOffset(Math.max(-limit, Math.min(limit, delta)))
    } : undefined}
    onPointerUp={interactive ? release : undefined} onPointerCancel={interactive ? release : undefined} onLostPointerCapture={interactive ? release : undefined}>
    <span className="toon-position"><Cartoon avatar={character.avatar} item={item} /></span>
  </Root>
}
