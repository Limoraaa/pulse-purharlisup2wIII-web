'use client';

import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
  colorTheme?: 'blue' | 'red' | 'emerald' | 'purple';
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendDirection = 'up',
  colorTheme = 'blue',
}: StatCardProps) {
  // Peta warna tema card
  const themeClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl border ${themeClasses[colorTheme]}`}>
        {icon}
      </div>
    </div>
  );
}