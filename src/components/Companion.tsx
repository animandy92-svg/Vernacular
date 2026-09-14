import type { CSSProperties } from 'react'
import type { CompanionStyle } from '../types'

export type CompanionPose = 'idle' | 'walk' | 'wave' | 'talk' | 'point' | 'carry' | 'celebrate'
export type CompanionItem = 'book' | 'basket' | 'map' | 'star' | 'none'

const ITEMS: Record<Exclude<CompanionItem, 'none'>, string> = {
  book: '📖',
  basket: '🧺',
  map: '🗺️',
  star: '⭐',
}

interface Props {
  character: CompanionStyle
  pose?: CompanionPose
  item?: CompanionItem
  size?: number
  className?: string
}

export function Companion({ character, pose = 'idle', item = 'none', size = 180, className = '' }: Props) {
  const style = { width: size } as CSSProperties
  const variant = character.avatar === 'kofi' && (pose === 'point' || pose === 'celebrate') ? `-${pose}`
    : character.avatar === 'esi' && pose === 'point' ? '-point' : ''
  return (
    <div className={`companion companion--${pose} companion--avatar-${character.avatar} ${className}`} style={style} role="img" aria-label={`${character.name}, your learning companion`}>
      <img src={`/characters/${character.avatar}${variant}.png`} alt="" draggable="false" />
      {item !== 'none' && <span className={`companion-prop companion-prop--${item}`} aria-hidden="true">{ITEMS[item]}</span>}
      <span className="companion-celebration" aria-hidden="true"><i>✦</i><i>●</i><i>★</i></span>
    </div>
  )
}
