'use client';

import { useUser } from './user-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { User, Crown } from 'lucide-react';

export function Header() {
  const { currentUser, users, setCurrentUser, isLoading } = useUser();

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
        </nav>

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
    </header>
  );
}
