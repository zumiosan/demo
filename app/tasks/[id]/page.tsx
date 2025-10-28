'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/user-context';
import Link from 'next/link';

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  startDate: string | null;
  endDate: string | null;
  assignedUser: {
    id: string;
    name: string;
    role: string;
  } | null;
  agent: {
    name: string;
    personality: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
}

interface Conversation {
  id: string;
  message: string;
  sender: 'user' | 'agent';
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const [task, setTask] = useState<Task | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const taskId = params?.id as string;

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchConversations();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      setSending(true);
      const response = await fetch(`/api/tasks/${taskId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations([...conversations, data.userMessage, data.agentMessage]);
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      TODO: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      REVIEW: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels = {
      TODO: '未着手',
      IN_PROGRESS: '進行中',
      REVIEW: 'レビュー中',
      COMPLETED: '完了',
      CANCELLED: 'キャンセル',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">タスクを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">タスクが見つかりません</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href={`/projects/${task.project.id}`}
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← {task.project.name}に戻る
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.name}</h1>
              <p className="text-gray-600 mt-2">{task.description}</p>
            </div>
            {getStatusBadge(task.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: タスク情報 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">タスク情報</h2>

              {/* 進捗 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">進捗</span>
                  <span className="font-semibold">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* 担当者 */}
              <div className="mb-4">
                <span className="text-sm text-gray-600">担当者</span>
                <p className="font-semibold">{task.assignedUser?.name || '未割り当て'}</p>
              </div>

              {/* エージェント */}
              {task.agent && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">タスクエージェント</span>
                  <p className="font-semibold">{task.agent.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{task.agent.personality}</p>
                </div>
              )}

              {/* 期間 */}
              {task.startDate && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">開始日</span>
                  <p className="font-semibold">
                    {new Date(task.startDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
              {task.endDate && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">完了予定日</span>
                  <p className="font-semibold">
                    {new Date(task.endDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 右側: エージェントとの会話 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  {task.agent?.name || 'タスクエージェント'}との会話
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  タスクについて質問したり、進捗を確認できます
                </p>
              </div>

              {/* 会話エリア */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>まだメッセージがありません</p>
                    <p className="text-sm mt-2">エージェントに質問してみましょう！</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex ${conv.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          conv.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {conv.sender === 'user' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                            </svg>
                          )}
                          <span className="text-xs font-semibold">
                            {conv.sender === 'user' ? conv.user.name : task.agent?.name || 'エージェント'}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{conv.message}</div>
                        <div className={`text-xs mt-2 ${conv.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(conv.createdAt).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* メッセージ入力エリア */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? '送信中...' : '送信'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
