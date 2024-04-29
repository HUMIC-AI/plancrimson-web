import { Context, useContext } from 'react';
import { CourseBrief } from '../../components/ClassesCloudPage/useData';
import { choose } from '../lib';
import type { UserProfile, UserSettings } from '../types';

export const isDevelopment = process.env.NODE_ENV === 'development';

export function getInitialSettings(): UserSettings {
  return {
    chosenSchedules: {},
    customTimes: {},
    waivedRequirements: {},
    pairwiseRankings: [],
  };
}

export function useAssertContext<T>(C: Context<T | null>): T {
  const context = useContext(C);
  if (!context) throw new Error('Context not found');
  return context;
}

export function getDisplayName(profile?: UserProfile) {
  return profile?.displayName || profile?.username || 'Anonymous';
}

/**
 * @returns the username part of an email address
 */
export function extractUsername(email: string) {
  return email.slice(0, email.lastIndexOf('@'));
}


export function downloadJson(filename: string, data: object | string, extension = 'json') {
  if (typeof window === 'undefined') return;
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
    typeof data === 'string' ? data : JSON.stringify(data),
  )}`;
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `${filename}.${extension}`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function getRandomRatedCourse(courses: CourseBrief[]) {
  return choose(courses.filter((c) => c.meanRating));
}
