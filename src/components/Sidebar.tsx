import { Bell, BarChart2, HelpCircle, PlusSquare, Globe, Settings, X, Sparkles, ChevronRight, CreditCard, Crown, Check, LifeBuoy } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, isMobileMenuOpen, onClose }: SidebarProps) {
  const { subscription, isPaidPlan, loading: subscriptionLoading } = useSubscription();

  const menuItems = [
    {
      category: 'WORKSPACE',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: null },
        { id: 'create-notification', label: 'Create New', icon: PlusSquare, badge: null },
        { id: 'sites', label: 'Sites', icon: Globe, badge: null },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, badge: null },
      ]
    },
    {
      category: 'TOOLS',
      items: [
        { id: 'billing', label: 'Billing', icon: CreditCard, badge: null },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
      ]
    },
    {
      category: 'SUPPORT',
      items: [
        { id: 'help', label: 'Help Center', icon: HelpCircle, badge: null },
        { id: 'support', label: 'Contact Support', icon: LifeBuoy, badge: null },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 sm:top-16 bottom-0 left-0 z-40
          w-[280px] sm:w-[300px] lg:w-[260px]
          bg-white border-r border-surface-200/80
          flex flex-col
          transform transition-all duration-300 ease-out lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0 shadow-soft-xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 lg:hidden">
          <span className="text-sm font-semibold text-surface-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl hover:bg-surface-100 active:bg-surface-200 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin">
          {menuItems.map((category, categoryIndex) => (
            <div key={category.category} className={categoryIndex > 0 ? 'pt-2' : ''}>
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                  {category.category}
                </span>
                <div className="flex-1 h-px bg-surface-100" />
              </div>
              <div className="space-y-1">
                {category.items.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`
                        group w-full flex items-center justify-between 
                        px-3 py-2.5 rounded-xl
                        transition-all duration-200 ease-out
                        ${isActive
                          ? 'bg-brand-50 text-brand-700 shadow-soft-sm'
                          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                        }
                      `}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-1.5 rounded-lg transition-colors duration-200
                          ${isActive
                            ? 'bg-brand-100'
                            : 'bg-surface-100 group-hover:bg-surface-200'
                          }
                        `}>
                          <Icon className={`
                            w-4 h-4 transition-colors duration-200
                            ${isActive
                              ? 'text-brand-600'
                              : 'text-surface-500 group-hover:text-surface-700'
                            }
                          `} />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>

                      {/* Active indicator arrow */}
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-brand-400 animate-fade-in" />
                      )}

                      {/* Badge if exists */}
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - Conditional based on subscription */}
        <div className="p-4 border-t border-surface-100">
          {subscriptionLoading ? (
            <div className="rounded-2xl bg-surface-100 p-4 animate-pulse">
              <div className="h-4 bg-surface-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-surface-200 rounded w-3/4 mb-3"></div>
              <div className="h-10 bg-surface-200 rounded"></div>
            </div>
          ) : isPaidPlan ? (
            /* Paid Plan - Show current plan info */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 shadow-soft-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                    {subscription?.plan?.tier === 'growth' ? 'Growth' : 'Pro'} Plan
                  </span>
                </div>

                <h4 className="text-base font-semibold text-white mb-1">
                  {subscription?.plan?.name || 'Premium'}
                </h4>
                <p className="text-xs text-white/70 mb-3 leading-relaxed flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active subscription
                </p>

                <button
                  onClick={() => onSectionChange('billing')}
                  className="
                  w-full py-2.5 px-4 
                  bg-white/20 text-white 
                  text-sm font-semibold rounded-xl
                  backdrop-blur-sm border border-white/20
                  hover:bg-white/30
                  active:scale-[0.98]
                  transition-all duration-200
                ">
                  Manage Plan
                </button>
              </div>
            </div>
          ) : (
            /* Free Plan - Show upgrade CTA */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 p-4 shadow-soft-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Pro Plan</span>
                </div>

                <h4 className="text-base font-semibold text-white mb-1">
                  Unlock Premium
                </h4>
                <p className="text-xs text-white/70 mb-4 leading-relaxed">
                  Get unlimited notifications, advanced analytics & priority support.
                </p>

                <button
                  onClick={() => onSectionChange('billing')}
                  className="
                  w-full py-2.5 px-4 
                  bg-white text-brand-700 
                  text-sm font-semibold rounded-xl
                  shadow-soft-sm
                  hover:bg-white/95 hover:shadow-soft
                  active:scale-[0.98]
                  transition-all duration-200
                ">
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}