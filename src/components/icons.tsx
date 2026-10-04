import type { ReactNode, SVGProps } from 'react'

import { ICON_SHAPES } from './iconShapes'

type IconProps = {
  className?: string | undefined
}

type PaintedIconProps = IconProps & { children: ReactNode }

const VIEW_BOX = '0 0 20 20'
const STROKE_WIDTH = 1.75

const STROKE_PAINT: SVGProps<SVGSVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const FILL_PAINT: SVGProps<SVGSVGElement> = { fill: 'currentColor' }

function IconSvg({
  className,
  children,
  paint,
}: PaintedIconProps & { paint: SVGProps<SVGSVGElement> }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className} {...paint}>
      {children}
    </svg>
  )
}

function StrokeIcon({ className, children }: PaintedIconProps) {
  return (
    <IconSvg className={className} paint={STROKE_PAINT}>
      {children}
    </IconSvg>
  )
}

function FillIcon({ className, children }: PaintedIconProps) {
  return (
    <IconSvg className={className} paint={FILL_PAINT}>
      {children}
    </IconSvg>
  )
}

function CircledIcon({ className, children }: PaintedIconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="10" cy="10" r="6.5" />
      {children}
    </StrokeIcon>
  )
}

function ShapeIcon({ shape, className }: IconProps & { shape: keyof typeof ICON_SHAPES }) {
  return <StrokeIcon className={className}>{ICON_SHAPES[shape]}</StrokeIcon>
}

export function BooksIcon({ className }: IconProps) {
  return <ShapeIcon shape="books" className={className} />
}

export function SettingsIcon({ className }: IconProps) {
  return <ShapeIcon shape="settings" className={className} />
}

export function HelpIcon({ className }: IconProps) {
  return <ShapeIcon shape="help" className={className} />
}

export function LogoutIcon({ className }: IconProps) {
  return <ShapeIcon shape="logout" className={className} />
}

export function CopyIcon({ className }: IconProps) {
  return <ShapeIcon shape="copy" className={className} />
}

export function MailIcon({ className }: IconProps) {
  return <ShapeIcon shape="mail" className={className} />
}

export function WarningIcon({ className }: IconProps) {
  return <ShapeIcon shape="warning" className={className} />
}

export function ListIcon({ className }: IconProps) {
  return <ShapeIcon shape="list" className={className} />
}

export function GridIcon({ className }: IconProps) {
  return <ShapeIcon shape="grid" className={className} />
}

export function SearchIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3.5 3.5" />
    </StrokeIcon>
  )
}

export function ClearIcon({ className }: IconProps) {
  return <ShapeIcon shape="clear" className={className} />
}

export function CheckIcon({ className }: IconProps) {
  return <ShapeIcon shape="check" className={className} />
}

export function CommentIcon({ className }: IconProps) {
  return <ShapeIcon shape="comment" className={className} />
}

export function OpenBookIcon({ className }: IconProps) {
  return <ShapeIcon shape="openBook" className={className} />
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m12 5-5 5 5 5" />
    </StrokeIcon>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m8 5 5 5-5 5" />
    </StrokeIcon>
  )
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="m5 8 5 5 5-5" />
    </StrokeIcon>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8L10 1.6z" />
    </FillIcon>
  )
}

const HEART_PATH = 'M10 16.5s-6-3.6-6-8a3.4 3.4 0 0 1 6-2.1 3.4 3.4 0 0 1 6 2.1c0 4.4-6 8-6 8z'

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <FillIcon className={className}>
        <path d={HEART_PATH} />
      </FillIcon>
    )
  }
  return (
    <StrokeIcon className={className}>
      <path d={HEART_PATH} />
    </StrokeIcon>
  )
}

export function WantIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 3.5h8v13l-4-3-4 3z" />
    </StrokeIcon>
  )
}

export function ReadingIcon({ className }: IconProps) {
  return (
    <CircledIcon className={className}>
      <path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" stroke="none" />
    </CircledIcon>
  )
}

export function ReadIcon({ className }: IconProps) {
  return (
    <CircledIcon className={className}>
      <path d="m7 10.2 2 2 4-4.4" />
    </CircledIcon>
  )
}

export function DroppedIcon({ className }: IconProps) {
  return (
    <CircledIcon className={className}>
      <path d="m7.6 7.6 4.8 4.8m0-4.8-4.8 4.8" />
    </CircledIcon>
  )
}

export function RemoveIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9.5h6.8L14 6M8.5 9v4M11.5 9v4" />
    </StrokeIcon>
  )
}

export function QuoteIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4.5 7.5h3.5v3c0 1.7-1 3-3 3M11.5 7.5H15v3c0 1.7-1 3-3 3" />
    </StrokeIcon>
  )
}

export function BulletListIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M8 5.5h8M8 10h8M8 14.5h8M4 5.5h.01M4 10h.01M4 14.5h.01" />
    </StrokeIcon>
  )
}

export function NumberedListIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M9 5.5h7M9 10h7M9 14.5h7M3.8 4.6l1-.6v3.2M3.6 12.3c1.5-1.1 2.3.3 1.1 1.3l-1.2 1.1h2.3" />
    </StrokeIcon>
  )
}

export function LinkIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M8.7 11.3a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.8.8M11.3 8.7a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.8-.8" />
    </StrokeIcon>
  )
}
