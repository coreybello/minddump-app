import React from 'react'
import { Card, CardContent } from './ui/card'
import { cn } from '../utils/cn'
import type { StatsCardVariants } from '../types/minddump'

interface StatsCardProps extends Partial<StatsCardVariants> {
  title: string
  value: number | string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
  valueClassName?: string
  iconClassName?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  layout = 'horizontal',
  emphasis = 'balanced',
  animation = true,
  className,
  valueClassName,
  iconClassName,
  ...props
}: StatsCardProps) {
  const cardClasses = cn(
    'cyber-card transition-all duration-200',
    {
      'hover:shadow-md hover:border-neon-purple/40 hover:scale-105': animation,
    },
    className
  )

  const contentClasses = cn(
    'p-4',
    layout === 'vertical' ? 'text-center space-y-2' : 'flex items-center justify-between'
  )

  const titleClasses = cn(
    'font-medium text-neon-green font-mono',
    {
      'text-xs': emphasis === 'number',
      'text-sm': emphasis === 'balanced',
      'text-base': emphasis === 'icon',
    }
  )

  const valueClasses = cn(
    'font-bold text-neon-cyan',
    {
      'text-4xl': emphasis === 'number',
      'text-2xl': emphasis === 'balanced',
      'text-xl': emphasis === 'icon',
    },
    valueClassName
  )

  const iconClasses = cn(
    'text-neon-purple',
    {
      'h-6 w-6': emphasis === 'number',
      'h-8 w-8': emphasis === 'balanced',
      'h-12 w-12': emphasis === 'icon',
    },
    iconClassName
  )

  return (
    <Card className={cardClasses} {...props}>
      <CardContent className={contentClasses}>
        {layout === 'horizontal' ? (
          <>
            <div className="flex-1">
              <p className={titleClasses}>{title}</p>
              <p className={valueClasses}>{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
              {trend && (
                <div className={cn(
                  'flex items-center mt-1 text-xs',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}>
                  <span className={cn(
                    'mr-1',
                    trend.positive ? '↗' : '↘'
                  )}>
                    {Math.abs(trend.value)}%
                  </span>
                  <span className="text-gray-500">{trend.label}</span>
                </div>
              )}
            </div>
            {Icon && <Icon className={iconClasses} />}
          </>
        ) : (
          <>
            {Icon && <Icon className={cn(iconClasses, 'mx-auto')} />}
            <div>
              <p className={titleClasses}>{title}</p>
              <p className={valueClasses}>{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
              {trend && (
                <div className={cn(
                  'flex items-center justify-center mt-1 text-xs',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}>
                  <span className={cn(
                    'mr-1',
                    trend.positive ? '↗' : '↘'
                  )}>
                    {Math.abs(trend.value)}%
                  </span>
                  <span className="text-gray-500">{trend.label}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StatsCard