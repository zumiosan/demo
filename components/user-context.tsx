'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserWithAgent } from '@/types';

type UserContextType = {
  currentUser: UserWithAgent | null;
  setCurrentUser: (user: UserWithAgent | null) => void;
  users: UserWithAgent[];
  setUsers: (users: UserWithAgent[]) => void;
  isLoading: boolean;
  reloadUsers: (selectUserId?: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserWithAgent | null>(null);
  const [users, setUsers] = useState<UserWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー一覧を取得する関数
  const loadUsers = async (selectUserId?: string) => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);

      let userToSelect: UserWithAgent | null = null;

      if (selectUserId) {
        // 指定されたユーザーIDがあればそれを選択
        userToSelect = data.find((u: UserWithAgent) => u.id === selectUserId) || null;
      } else {
        // localStorageから保存されたユーザーIDを取得
        const savedUserId = localStorage.getItem('currentUserId');
        if (savedUserId) {
          userToSelect = data.find((u: UserWithAgent) => u.id === savedUserId) || null;
        }
      }

      if (userToSelect) {
        setCurrentUser(userToSelect);
        localStorage.setItem('currentUserId', userToSelect.id);
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUserId');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ユーザー切り替え時にlocalStorageを更新
  const handleSetCurrentUser = (user: UserWithAgent | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUserId', user.id);
    } else {
      localStorage.removeItem('currentUserId');
    }
  };

  // ユーザー一覧を再読み込みする関数
  const reloadUsers = async (selectUserId?: string) => {
    await loadUsers(selectUserId);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        setUsers,
        isLoading,
        reloadUsers
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
