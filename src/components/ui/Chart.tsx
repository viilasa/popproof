import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Simple Bar Chart
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
}

export function BarChart({ 
  data, 
  height = 200, 
  showLabels = true, 
  showValues = true,
  animated = true 
}: BarChartProps) {
  const [isVisible, setIsVisible] = useState(!animated);
  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              {showValues && (
                <span className="text-xs font-medium text-surface-600">
                  {item.value.toLocaleString()}
                </span>
              )}
              <div 
                className="w-full bg-surface-100 rounded-t-lg overflow-hidden"
                style={{ height: height - 40 }}
              >
                <div
                  className={`
                    w-full rounded-t-lg transition-all duration-700 ease-out
                    ${item.color || 'bg-brand-500'}
                  `}
                  style={{ 
                    height: isVisible ? `${percentage}%` : '0%',
                    transitionDelay: `${index * 50}ms`
                  }}
                />
              </div>
              {showLabels && (
                <span className="text-xs text-surface-500 truncate max-w-full">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Line/Area Chart (Simple SVG-based)
interface LineChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  showArea?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  animated?: boolean;
}

export function LineChart({
  data,
  labels,
  height = 200,
  color = '#6366f1',
  showArea = true,
  showDots = true,
  showGrid = true,
  animated = true,
}: LineChartProps) {
  const [isVisible, setIsVisible] = useState(!animated);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 100; // percentage-based
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((value - minValue) / range) * 100,
    value,
  }));
  
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div className="w-full" style={{ height }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="text-surface-200">
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}
          </g>
        )}
        
        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={`${color}15`}
            className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            strokeDasharray: isVisible ? 'none' : '1000',
            strokeDashoffset: isVisible ? '0' : '1000',
          }}
        />
        
        {/* Dots */}
        {showDots && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill="white"
            stroke={color}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className={`transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: `${index * 50}ms` }}
          />
        ))}
      </svg>
      
      {/* Labels */}
      {labels && (
        <div className="flex justify-between mt-2 px-1">
          {labels.map((label, i) => (
            <span key={i} className="text-xs text-surface-400">{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Donut/Pie Chart
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 24,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f4f4f5"
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = item.value / total;
            const dashLength = circumference * percentage;
            const offset = currentOffset;
            currentOffset += dashLength;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${isVisible ? dashLength : 0} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{ transitionDelay: `${index * 100}ms` }}
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-2xl font-bold text-surface-900">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-surface-500">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-surface-600">{item.label}</span>
              <span className="text-sm font-medium text-surface-900 ml-auto">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sparkline (Mini inline chart)
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showTrend?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#6366f1',
  showTrend = false,
}: SparklineProps) {
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - minValue) / range) * height,
  }));
  
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  const trend = data[data.length - 1] - data[0];
  const trendPercent = ((trend / data[0]) * 100).toFixed(1);

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTrend && (
        <span className={`
          inline-flex items-center text-xs font-medium
          ${trend > 0 ? 'text-success-600' : trend < 0 ? 'text-danger-600' : 'text-surface-500'}
        `}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : 
           trend < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : 
           <Minus className="w-3 h-3 mr-0.5" />}
          {trend > 0 ? '+' : ''}{trendPercent}%
        </span>
      )}
    </div>
  );
}

// Progress Bar
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'bg-brand-500',
  animated = true,
}: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : (value / max) * 100);
  const percentage = (value / max) * 100;
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(percentage), 100);
      return () => clearTimeout(timer);
    }
  }, [animated, percentage]);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-surface-600">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-surface-900">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-surface-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// Stat with Sparkline
interface StatWithChartProps {
  label: string;
  value: string | number;
  change?: number;
  data: number[];
  color?: string;
}

export function StatWithChart({
  label,
  value,
  change,
  data,
  color = '#6366f1',
}: StatWithChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
          {change !== undefined && (
            <span className={`
              inline-flex items-center gap-1 text-xs font-medium mt-2
              ${change > 0 ? 'text-success-600' : change < 0 ? 'text-danger-600' : 'text-surface-500'}
            `}>
              {change > 0 ? <TrendingUp className="w-3 h-3" /> : 
               change < 0 ? <TrendingDown className="w-3 h-3" /> : 
               <Minus className="w-3 h-3" />}
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
        <Sparkline data={data} color={color} />
      </div>
    </div>
  );
}
