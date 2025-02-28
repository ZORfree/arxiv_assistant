'use client';

import { useState } from 'react';
import { UserPreference } from '@/lib/ai';

interface PreferenceFormProps {
  onSave: (preferences: UserPreference) => void;
  initialPreferences?: UserPreference;
}

export default function PreferenceForm({ onSave, initialPreferences }: PreferenceFormProps) {
  const [preferences, setPreferences] = useState<UserPreference>(initialPreferences || {
    profession: '',
    interests: [],
    nonInterests: []
  });

  const [newInterest, setNewInterest] = useState('');
  const [newNonInterest, setNewNonInterest] = useState('');

  const handleAddInterest = () => {
    if (newInterest.trim() && !preferences.interests.includes(newInterest.trim())) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleAddNonInterest = () => {
    if (newNonInterest.trim() && !preferences.nonInterests.includes(newNonInterest.trim())) {
      setPreferences(prev => ({
        ...prev,
        nonInterests: [...prev.nonInterests, newNonInterest.trim()]
      }));
      setNewNonInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleRemoveNonInterest = (nonInterest: string) => {
    setPreferences(prev => ({
      ...prev,
      nonInterests: prev.nonInterests.filter(i => i !== nonInterest)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(preferences);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div>
        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          职业/研究领域
        </label>
        <input
          type="text"
          id="profession"
          value={preferences.profession}
          onChange={(e) => setPreferences(prev => ({ ...prev, profession: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          感兴趣的研究方向
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="输入研究方向"
          />
          <button
            type="button"
            onClick={handleAddInterest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {preferences.interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100"
            >
              {interest}
              <button
                type="button"
                onClick={() => handleRemoveInterest(interest)}
                className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          不感兴趣的研究方向
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newNonInterest}
            onChange={(e) => setNewNonInterest(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="输入研究方向"
          />
          <button
            type="button"
            onClick={handleAddNonInterest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {preferences.nonInterests.map((nonInterest) => (
            <span
              key={nonInterest}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
            >
              {nonInterest}
              <button
                type="button"
                onClick={() => handleRemoveNonInterest(nonInterest)}
                className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          保存设置
        </button>
      </div>
    </form>
  );
}