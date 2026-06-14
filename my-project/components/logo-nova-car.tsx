import Image from 'next/image'

interface LogoNovaCarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LogoNovaCar({ size = 'md', className = '' }: LogoNovaCarProps) {
  const dimensions = {
    sm: { width: 120, height: 60 },
    md: { width: 200, height: 100 },
    lg: { width: 300, height: 150 },
  }

  const dim = dimensions[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/nova-car-logo.png"
        alt="NOVA CAR"
        width={dim.width}
        height={dim.height}
        priority
      />
    </div>
  )
}
