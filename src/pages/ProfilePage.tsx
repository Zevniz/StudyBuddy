import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  Clock,
  CheckCircle,
  ShieldCheck,
  Zap,
  HeartHandshake,
  GraduationCap,
  Sparkles,
  Rocket,
  Repeat,
  Calendar,
} from 'lucide-react'
import { cn, getInitials, formatDate, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { mockUsers, mockReviews } from '@/data/mock'
import { BADGE_INFO, REPUTATION_LEVELS } from '@/types'
import type { BadgeType } from '@/types'
import { TaskCard } from '@/components/tasks/TaskCard'

const badgeIcons: Record<BadgeType, typeof Star> = {
  reliable: ShieldCheck,
  fast_responder: Zap,
  helpful: HeartHandshake,
  academic: GraduationCap,
  mentor: Sparkles,
  newcomer: Rocket,
  exchange_master: Repeat,
}

type Tab = 'tasks' | 'history' | 'reviews'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const allTasks = useTaskStore((s) => s.tasks)
  const [activeTab, setActiveTab] = useState<Tab>('tasks')

  const profileUser = id ? mockUsers.find((u) => u.id === id) : currentUser
  if (!profileUser) return null

  const userTasks = allTasks.filter((t) => t.authorId === profileUser.id)
  const activeTasks = userTasks.filter((t) => t.status !== 'closed')
  const completedTasks = userTasks.filter((t) => t.status === 'closed')
  const userReviews = mockReviews.filter((r) => r.toUserId === profileUser.id)
  const level = REPUTATION_LEVELS[profileUser.reputationLevel]

  const nextLevel = (() => {
    const levels = Object.values(REPUTATION_LEVELS)
    const currentIdx = levels.findIndex((l) => l.label === level.label)
    return currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null
  })()

  const progressToNext = nextLevel
    ? ((profileUser.reputation - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
    : 100

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'tasks', label: 'Активные задачи', count: activeTasks.length },
    { key: 'history', label: 'История', count: completedTasks.length },
    { key: 'reviews', label: 'Отзывы', count: userReviews.length },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        {/* Banner gradient */}
        <div className="h-32 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              {profileUser.avatar ? (
                <img
                  src={profileUser.avatar}
                  alt=""
                  className="w-24 h-24 rounded-2xl bg-muted border-4 border-background"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 border-4 border-background flex items-center justify-center text-2xl font-bold">
                  {getInitials(profileUser.name)}
                </div>
              )}
              {profileUser.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-3 border-background" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <p className="text-sm text-muted-foreground">{profileUser.university}</p>
              <p className="text-xs text-muted-foreground">{profileUser.faculty}</p>
            </div>

            {/* Level badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl border"
              style={{ borderColor: `${level.color}30`, backgroundColor: `${level.color}10` }}
            >
              <Star className="w-4 h-4" style={{ color: level.color }} />
              <span className="text-sm font-semibold" style={{ color: level.color }}>{level.label}</span>
            </div>
          </div>

          {profileUser.bio && (
            <p className="text-sm text-foreground/80 mt-4 leading-relaxed">{profileUser.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Star, label: 'Репутация', value: profileUser.reputation, color: 'text-amber-400' },
              { icon: CheckCircle, label: 'Выполнено', value: profileUser.completedTasks, color: 'text-emerald-400' },
              { icon: Clock, label: 'Отклик', value: profileUser.responseTime, color: 'text-teal-400' },
              { icon: Calendar, label: 'На платформе', value: `с ${formatDate(profileUser.joinedAt)}`, color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-card border border-border p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Reputation progress */}
          {nextLevel && (
            <div className="mt-4 p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{level.label}</span>
                <span>{nextLevel.label}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {profileUser.reputation} / {nextLevel.minPoints} баллов
              </p>
            </div>
          )}

          {/* Badges */}
          {profileUser.badges.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Бейджи</p>
              <div className="flex flex-wrap gap-2">
                {profileUser.badges.map((badge) => {
                  const info = BADGE_INFO[badge]
                  const Icon = badgeIcons[badge]
                  return (
                    <div
                      key={badge}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border"
                      title={info.description}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-medium">{info.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key ? 'text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="profile-tab"
                className="absolute inset-0 bg-muted rounded-lg"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative">
              {tab.label} <span className="text-muted-foreground">({tab.count})</span>
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Нет активных задач</p>
            ) : (
              activeTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Нет завершённых задач</p>
            ) : (
              completedTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Нет отзывов</p>
            ) : (
              userReviews.map((review) => {
                const reviewer = mockUsers.find((u) => u.id === review.fromUserId)
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start gap-3">
                      {reviewer?.avatar ? (
                        <img src={reviewer.avatar} alt="" className="w-9 h-9 rounded-full bg-muted" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold">
                          {reviewer ? getInitials(reviewer.name) : '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{reviewer?.name}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-3.5 h-3.5',
                                  i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 mt-2">{review.text}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {review.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{timeAgo(review.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
