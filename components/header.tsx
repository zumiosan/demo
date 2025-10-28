'use client';

import { useUser } from './user-context';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { User, Crown, Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
}

export function Header() {
  const { currentUser, users, setCurrentUser, isLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // 30秒ごとに通知を取得
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold text-xl">Cristal Match</span>
          </a>
        </div>

        <nav className="flex items-center gap-6 text-sm flex-1">
          <a
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            ダッシュボード
          </a>
          <a
            href="/projects"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            プロジェクト
          </a>
          <a
            href="/projects/browse"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            全プロジェクト
          </a>
          <a
            href="/offers"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            オファー
          </a>
          <a
            href="/interviews"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            面接
          </a>
          <a
            href="/profile"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            プロフィール
          </a>
          <a
            href="/register"
            className="transition-colors hover:text-foreground/80 text-primary font-medium"
          >
            新規登録
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {/* 通知アイコン */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-muted rounded-md transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 通知ドロップダウン */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="font-semibold">通知</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        通知はありません
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            window.location.href = `/projects/${notification.project.id}`;
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`h-2 w-2 rounded-full ${
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  notification.type === 'error' ? 'bg-red-500' :
                                  notification.type === 'success' ? 'bg-green-500' :
                                  'bg-blue-500'
                                }`} />
                                <span className="font-semibold text-sm">
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <Badge variant="default" className="text-xs">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{notification.project.name}</span>
                                <span>•</span>
                                <span>
                                  {new Date(notification.createdAt).toLocaleString('ja-JP')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ユーザー選択 */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
            value={currentUser?.id || ''}
            onValueChange={(value) => {
              const user = users.find((u) => u.id === value);
              if (user) setCurrentUser(user);
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="ユーザーを選択" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    {user.role === 'PM' && <Crown className="h-3 w-3 text-yellow-600" />}
                    <span>{user.name}</span>
                    <Badge variant={user.role === 'PM' ? 'default' : 'outline'} className="text-xs">
                      {user.role === 'PM' ? 'PM' : 'メンバー'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentUser && (
            <Badge variant={currentUser.role === 'PM' ? 'default' : 'outline'} className="ml-1">
              {currentUser.role === 'PM' ? 'PM' : 'メンバー'}
            </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
