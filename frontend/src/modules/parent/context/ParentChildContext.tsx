import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ParentChildCard } from '../types/parent';
import { parentApi } from '../api/parentApi';

interface ParentChildContextType {
  childrenList: ParentChildCard[];
  selectedChildId: string | 'all';
  setSelectedChildId: (id: string | 'all') => void;
  activeChild: ParentChildCard | null;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ParentChildContext = createContext<ParentChildContextType | undefined>(undefined);

export const ParentChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<ParentChildCard[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | 'all'>(() => {
    return localStorage.getItem('parent_active_child_id') || 'all';
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(1);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setSelectedChildId = useCallback((id: string | 'all') => {
    setSelectedChildIdState(id);
    localStorage.setItem('parent_active_child_id', id);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const kids = await parentApi.getChildren();
      setChildrenList(kids);

      // If user had a selection that no longer exists, reset
      const stored = localStorage.getItem('parent_active_child_id');
      if (stored && stored !== 'all' && !kids.some((k) => k.childId === stored)) {
        if (kids.length > 0) {
          setSelectedChildId(kids[0].childId);
        } else {
          setSelectedChildId('all');
        }
      } else if (!stored && kids.length === 1) {
        setSelectedChildId(kids[0].childId);
      }

      // Calculate unread tallies
      const notifs = await parentApi.getNotifications();
      setUnreadNotificationsCount(notifs.filter((n) => !n.isRead).length);

      const convos = await parentApi.getConversations();
      const unreadTotal = convos.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadMessagesCount(unreadTotal);
    } catch (err) {
      console.error('Failed to load parent children context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setSelectedChildId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeChild = useMemo(() => {
    if (selectedChildId === 'all') {
      return childrenList[0] || null;
    }
    return childrenList.find((k) => k.childId === selectedChildId) || childrenList[0] || null;
  }, [childrenList, selectedChildId]);

  return (
    <ParentChildContext.Provider
      value={{
        childrenList,
        selectedChildId,
        setSelectedChildId,
        activeChild,
        unreadNotificationsCount,
        unreadMessagesCount,
        isLoading,
        refresh,
      }}
    >
      {children}
    </ParentChildContext.Provider>
  );
};

export const useParentChild = (): ParentChildContextType => {
  const ctx = useContext(ParentChildContext);
  if (!ctx) {
    throw new Error('useParentChild must be used within a ParentChildProvider');
  }
  return ctx;
};
