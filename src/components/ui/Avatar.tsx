import { HTMLAttributes, ReactNode } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away' | 'busy';
  badge?: ReactNode;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2 border-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3 h-3 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-4 h-4 border-2' },
};

const statusColors: Record<string, string> = {
  online: 'bg-success-500',
  offline: 'bg-surface-400',
  away: 'bg-warning-500',
  busy: 'bg-danger-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-brand-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-teal-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  badge,
  className = '',
  ...props
}: AvatarProps) {
  const styles = sizeStyles[size];
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getColorFromName(name) : 'bg-surface-300';

  return (
    <div className={`relative inline-flex ${className}`} {...props}>
      <div
        className={`
          ${styles.container}
          relative inline-flex items-center justify-center
          rounded-full overflow-hidden
          ring-2 ring-white
          transition-transform duration-200
          hover:scale-105
        `}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`
              w-full h-full flex items-center justify-center
              ${bgColor} text-white font-medium
              ${styles.text}
            `}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${styles.status}
            ${statusColors[status]}
            rounded-full border-white
          `}
        />
      )}

      {/* Custom badge */}
      {badge && (
        <span className="absolute -top-1 -right-1">
          {badge}
        </span>
      )}
    </div>
  );
}

// Avatar Group Component
interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string; alt?: string }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${sizeStyles[size].container}
            relative inline-flex items-center justify-center
            rounded-full bg-surface-200 text-surface-600
            ring-2 ring-white font-medium
            ${sizeStyles[size].text}
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
