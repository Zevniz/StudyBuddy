import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Users,
  ArrowRightLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  Send,
  Star,
} from 'lucide-react'
import { cn, formatDate, timeAgo, getInitials, pluralize } from '@/lib/utils'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { CATEGORY_LABELS } from '@/types'
import { TaskStatusBadge, UrgencyBadge } from '@/components/tasks/TaskStatusBadge'
import { mockUsers } from '@/data/mock'
import { useState } from 'react'

export default function TaskPage() {
  const { id } = useParams<{ id: string }>()
  const tasks = useTaskStore((s) => s.tasks)
  const acceptResponse = useTaskStore((s) => s.acceptResponse)
  const addResponse = useTaskStore((s) => s.addResponse)
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const task = tasks.find((t) => t.id === id)
  const [responseText, setResponseText] = useState('')
  const [isExchange, setIsExchange] = useState(false)

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <p className="text-muted-foreground">Задача не найдена</p>
      </div>
    )
  }

  const author = mockUsers.find((u) => u.id === task.authorId)
  const spotsLeft = task.maxExecutors - task.acceptedExecutors.length
  const isAuthor = user?.id === task.authorId
  const alreadyResponded = task.responses.some((r) => r.userId === user?.id)

  const handleRespond = () => {
    if (!user || !responseText.trim()) return
    addResponse(task.id, {
      id: `resp-${Date.now()}`,
      taskId: task.id,
      userId: user.id,
      message: responseText,
      status: 'pending',
      isExchangeOffer: false,
      createdAt: new Date().toISOString(),
    })
    setResponseText('')
    addToast({ title: 'Отклик отправлен!', type: 'success' })
  }

  const handleAccept = (responseId: string) => {
    acceptResponse(task.id, responseId)
    addToast({ title: 'Исполнитель выбран!', type: 'success' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
      {/* Back */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к ленте
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Task card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold leading-snug">{task.title}</h1>
              <UrgencyBadge urgency={task.urgency} />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                {CATEGORY_LABELS[task.category]}
              </span>
              <TaskStatusBadge status={task.status} />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground/80">
                {task.format === 'online' ? <><Globe className="w-3 h-3" /> Онлайн</> : <><MapPin className="w-3 h-3" /> Оффлайн</>}
              </span>
              {task.allowExchange && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                  <ArrowRightLeft className="w-3 h-3" /> Обмен задачами
                </span>
              )}
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{task.description}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> до {formatDate(task.deadline)}
              </span>
              {task.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {task.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {spotsLeft > 0
                  ? `${spotsLeft} ${pluralize(spotsLeft, 'место', 'места', 'мест')} из ${task.maxExecutors}`
                  : 'Все места заняты'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {timeAgo(task.createdAt)}
              </span>
            </div>
          </div>

          {/* Responses */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Отклики ({task.responses.length})
            </h2>

            {task.responses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Пока нет откликов. Будьте первым!</p>
            ) : (
              <div className="space-y-3">
                {task.responses.map((resp) => {
                  const respUser = mockUsers.find((u) => u.id === resp.userId)
                  return (
                    <motion.div
                      key={resp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        resp.status === 'accepted'
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-border bg-card'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {respUser?.avatar ? (
                            <img src={respUser.avatar} alt="" className="w-9 h-9 rounded-full bg-muted shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold shrink-0">
                              {respUser ? getInitials(respUser.name) : '?'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{respUser?.name}</p>
                              {resp.isExchangeOffer && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400">
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> Обмен
                                </span>
                              )}
                              {resp.status === 'accepted' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                                  <CheckCircle className="w-2.5 h-2.5" /> Выбран
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{respUser?.university}</p>
                            <p className="text-sm text-foreground/80 mt-2">{resp.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(resp.createdAt)}</p>
                          </div>
                        </div>

                        {isAuthor && resp.status === 'pending' && spotsLeft > 0 && (
                          <button
                            onClick={() => handleAccept(resp.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all shrink-0"
                          >
                            Выбрать
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Respond form */}
            {!isAuthor && !alreadyResponded && task.status === 'open' && spotsLeft > 0 && (
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold">Откликнуться на задачу</h3>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Напишите, как вы можете помочь..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                />
                {task.allowExchange && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExchange}
                      onChange={(e) => setIsExchange(e.target.checked)}
                      className="rounded border-zinc-600"
                    />
                    Предложить обмен задачами
                  </label>
                )}
                <button
                  onClick={handleRespond}
                  disabled={!responseText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" /> Отправить отклик
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Author card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Автор задачи</p>
            <Link to={`/profile/${author?.id}`} className="flex items-center gap-3 group">
              {author?.avatar ? (
                <img src={author.avatar} alt="" className="w-12 h-12 rounded-full bg-muted" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold">
                  {author ? getInitials(author.name) : '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold group-hover:text-emerald-400 transition-colors">{author?.name}</p>
                <p className="text-xs text-muted-foreground">{author?.university}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                {author?.reputation} баллов
              </span>
              <span>{author?.completedTasks} выполнено</span>
            </div>
          </div>

          {/* Spots indicator */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Места</p>
            <div className="flex gap-1.5">
              {Array.from({ length: task.maxExecutors }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-2 rounded-full',
                    i < task.acceptedExecutors.length ? 'bg-emerald-500' : 'bg-accent'
                  )}
                />
              ))}
            </div>
            <p className="text-sm mt-2 text-foreground/80">
              {task.acceptedExecutors.length} из {task.maxExecutors} мест занято
            </p>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <Link
              to="/chats"
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-accent transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Написать автору
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
