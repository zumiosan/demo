'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserWithAgent } from '@/types';

type UserContextType = {
  currentUser: UserWithAgent | null;
  setCurrentUser: (user: UserWithAgent | null) => void;
  users: UserWithAgent[];
  setUsers: (users: UserWithAgent[]) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserWithAgent | null>(null);
  const [users, setUsers] = useState<UserWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ユーザー一覧を取得
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);

        // localStorageから保存されたユーザーIDを取得
        const savedUserId = localStorage.getItem('currentUserId');

        if (savedUserId) {
          // 保存されていたユーザーを探して設定
          const savedUser = data.find((u: UserWithAgent) => u.id === savedUserId);
          if (savedUser) {
            setCurrentUser(savedUser);
          } else if (data.length > 0) {
            // 保存されていたユーザーが見つからない場合は最初のユーザーを選択
            setCurrentUser(data[0]);
            localStorage.setItem('currentUserId', data[0].id);
          }
        } else if (data.length > 0) {
          // 保存されていない場合は最初のユーザーを選択
          setCurrentUser(data[0]);
          localStorage.setItem('currentUserId', data[0].id);
        }

        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch users:', error);
        setIsLoading(false);
      });
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

  return (
    <UserContext.Provider
      value={{ currentUser, setCurrentUser: handleSetCurrentUser, users, setUsers, isLoading }}
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
