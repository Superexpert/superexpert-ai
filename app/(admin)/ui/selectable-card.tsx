'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectableCardProps {
  id: string;
  name: string;
  description?: string;
  provider?: string; // Optional (for AI Model logos or labels)
  value: string;
  type?: 'radio' | 'checkbox';
  selected?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SelectableCard({
  id,
  name,
  description,
  provider,
  value,
  type = 'radio',
  selected = false,
  disabled = false,
  onChange,
}: SelectableCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition text-left',
        disabled && 'opacity-50 cursor-not-allowed',
        selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <input
          id={id}
          type={type}
          value={value}
          checked={selected}
          disabled={disabled}
          onChange={onChange}
          className="mt-1 h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-500"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{name}</span>
          {description && (
            <span className="text-sm text-gray-500 leading-snug mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>

      {provider && (
        <div className="mt-1 text-sm text-gray-400 font-medium whitespace-nowrap">
          {provider.toUpperCase()}
        </div>
      )}
    </label>
  );
}