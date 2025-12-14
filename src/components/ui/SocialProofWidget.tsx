import { useState, useEffect } from 'react';
import { ShoppingCart, Users, Star, TrendingUp, Clock, MapPin, CheckCircle } from 'lucide-react';

// Widget Types
type WidgetType = 'purchase' | 'signup' | 'review' | 'visitor' | 'activity';

interface SocialProofWidgetProps {
  type: WidgetType;
  title: string;
  subtitle?: string;
  time?: string;
  location?: string;
  avatar?: string;
  name?: string;
  rating?: number;
  verified?: boolean;
  animate?: boolean;
  onClose?: () => void;
}

const widgetIcons: Record<WidgetType, typeof ShoppingCart> = {
  purchase: ShoppingCart,
  signup: Users,
  review: Star,
  visitor: TrendingUp,
  activity: Clock,
};

export function SocialProofWidget({
  type,
  title,
  subtitle,
  time,
  location,
  name,
  rating,
  verified = false,
  animate = true,
  onClose,
}: SocialProofWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = widgetIcons[type];

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animate]);

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white rounded-xl border border-surface-100
        shadow-sm hover:shadow-md
        transition-all duration-300 ease-out
        ${animate ? (isVisible ? 'animate-notification-pop' : 'opacity-0 scale-95') : ''}
        max-w-[280px] w-full
      `}
    >
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar with initial or Icon */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            {name ? (
              <span className="text-white text-sm font-bold">{name.charAt(0)}</span>
            ) : (
              <Icon className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-surface-800 leading-tight">
              <span className="font-semibold">{title}</span>
              {subtitle && <span className="text-surface-500 ml-1">{subtitle}</span>}
            </p>
            
            {/* Rating stars for review type */}
            {type === 'review' && rating && (
              <div className="flex items-center gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < rating ? 'text-warning-500 fill-warning-500' : 'text-surface-200'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Meta info - single line */}
            <div className="flex items-center gap-2 mt-1">
              {time && (
                <span className="text-[10px] text-surface-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
                  {time}
                </span>
              )}
              {location && (
                <span className="text-[10px] text-surface-400 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {location}
                </span>
              )}
              {verified && (
                <span className="text-[10px] text-success-600 flex items-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-surface-100 transition-colors"
        >
          <svg className="w-3 h-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Compact version for lists
export function SocialProofWidgetCompact({
  type,
  title,
  time,
  name,
}: Pick<SocialProofWidgetProps, 'type' | 'title' | 'time' | 'name'>) {
  const Icon = widgetIcons[type];

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface-50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
        {name ? (
          <span className="text-white text-xs font-bold">{name.charAt(0)}</span>
        ) : (
          <Icon className="w-3.5 h-3.5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-surface-900 truncate">{title}</p>
        <p className="text-[10px] text-surface-400">{name} • {time}</p>
      </div>
    </div>
  );
}

// Widget preview for editor
export function SocialProofWidgetPreview({
  type = 'purchase',
}: {
  type?: WidgetType;
}) {
  const previewData: Record<WidgetType, SocialProofWidgetProps> = {
    purchase: {
      type: 'purchase',
      title: 'John D.',
      subtitle: 'purchased Premium Plan',
      time: '2 min ago',
      name: 'John Doe',
    },
    signup: {
      type: 'signup',
      title: 'Sarah M.',
      subtitle: 'joined the waitlist',
      time: '5 min ago',
      name: 'Sarah M',
    },
    review: {
      type: 'review',
      title: 'Mike R.',
      subtitle: '"Amazing product!"',
      time: '10 min ago',
      name: 'Mike R',
      rating: 5,
    },
    visitor: {
      type: 'visitor',
      title: '47 people',
      subtitle: 'viewing this page',
      time: 'Live',
    },
    activity: {
      type: 'activity',
      title: '156 sales',
      subtitle: 'today (+23%)',
      time: 'Now',
    },
  };

  return <SocialProofWidget {...previewData[type]} animate={false} />;
}
