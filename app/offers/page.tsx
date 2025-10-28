'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/components/user-context';
import Link from 'next/link';

interface Offer {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt: string | null;
  project: {
    id: string;
    name: string;
    description: string;
    agent: {
      name: string;
      personality: string;
    } | null;
    teamMembers: Array<{
      user: {
        id: string;
        name: string;
        role: string;
      };
    }>;
    tasks: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  };
  interview: {
    id: string;
    score: number;
    conversationLog: Array<{
      speaker: string;
      message: string;
      timestamp: string;
    }>;
    project: {
      name: string;
    };
  };
}

export default function OffersPage() {
  const { currentUser } = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchOffers();
    }
  }, [currentUser]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/offers?userId=${currentUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchOffers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to respond to offer');
      }
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      alert('Failed to respond to offer');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const labels = {
      PENDING: '保留中',
      ACCEPTED: '承諾済み',
      REJECTED: '辞退済み',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-yellow-600';
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
          <p className="text-gray-600">オファーを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">オファー一覧</h1>
          <p className="mt-2 text-gray-600">
            面接に合格したプロジェクトからのオファーを確認できます
          </p>
          <div className="mt-4">
            <Link
              href="/projects/browse"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              全プロジェクトを見る →
            </Link>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">まだオファーがありません</p>
            <Link
              href="/projects/browse"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              プロジェクトを探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {offer.project.name}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {offer.project.description}
                      </p>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        マッチングスコア
                      </span>
                      <span className={`text-2xl font-bold ${getScoreColor(offer.interview.score)}`}>
                        {offer.interview.score}点
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          offer.interview.score >= 80
                            ? 'bg-green-600'
                            : offer.interview.score >= 60
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{ width: `${offer.interview.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">チームメンバー: </span>
                      <span className="font-medium">
                        {offer.project.teamMembers.length}名
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">タスク数: </span>
                      <span className="font-medium">
                        {offer.project.tasks.length}件
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">エージェント: </span>
                      <span className="font-medium">
                        {offer.project.agent?.name || 'なし'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">オファー日時: </span>
                      <span className="font-medium">
                        {new Date(offer.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {offer.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleOfferAction(offer.id, 'accept')}
                          disabled={processing}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          承諾する
                        </button>
                        <button
                          onClick={() => handleOfferAction(offer.id, 'reject')}
                          disabled={processing}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          辞退する
                        </button>
                      </>
                    )}
                    {offer.status === 'ACCEPTED' && (
                      <Link
                        href={`/projects/${offer.project.id}`}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center transition-colors"
                      >
                        プロジェクトを見る
                      </Link>
                    )}
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      AIエージェント会話ログ
                    </p>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {offer.interview.conversationLog.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          会話ログはまだありません
                        </p>
                      ) : (
                        offer.interview.conversationLog.map((msg, idx) => {
                          const isProjectAgent =
                            msg.speaker === offer.project.agent?.name;
                          const isUserAgent = !isProjectAgent;

                          return (
                            <div
                              key={`${offer.id}-${idx}`}
                              className={`flex ${
                                isUserAgent ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
                                  isUserAgent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {isUserAgent ? (
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                    </svg>
                                  )}
                                  <div
                                    className={`font-semibold text-sm ${
                                      isUserAgent ? 'text-white' : 'text-gray-900'
                                    }`}
                                  >
                                    {msg.speaker}
                                  </div>
                                </div>
                                <div
                                  className={`text-sm ${
                                    isUserAgent ? 'text-white' : 'text-gray-700'
                                  }`}
                                >
                                  {msg.message}
                                </div>
                                <div
                                  className={`text-xs mt-2 ${
                                    isUserAgent ? 'text-blue-200' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(msg.timestamp).toLocaleString('ja-JP')}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
