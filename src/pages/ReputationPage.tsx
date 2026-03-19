import { motion } from 'framer-motion'
import {
  Star,
  ShieldCheck,
  Zap,
  HeartHandshake,
  GraduationCap,
  Sparkles,
  Rocket,
  Repeat,
  TrendingUp,
  Award,
  Heart,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { BADGE_INFO, REPUTATION_LEVELS } from '@/types'
import type { BadgeType, ReputationLevel } from '@/types'
import { mockReviews, mockUsers } from '@/data/mock'
import { getInitials } from '@/lib/utils'

const badgeIcons: Record<BadgeType, typeof Star> = {
  reliable: ShieldCheck,
  fast_responder: Zap,
  helpful: HeartHandshake,
  academic: GraduationCap,
  mentor: Sparkles,
  newcomer: Rocket,
  exchange_master: Repeat,
}

const allBadges: BadgeType[] = ['reliable', 'fast_responder', 'helpful', 'academic', 'mentor', 'exchange_master', 'newcomer']

export default function ReputationPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const level = REPUTATION_LEVELS[user.reputationLevel]
  const levels = Object.entries(REPUTATION_LEVELS) as [ReputationLevel, typeof level][]
  const currentLevelIdx = levels.findIndex(([key]) => key === user.reputationLevel)
  const nextLevel = currentLevelIdx < levels.length - 1 ? levels[currentLevelIdx + 1]?.[1] ?? null : null

  const progressToNext = nextLevel
    ? ((user.reputation - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
    : 100

  const userReviews = mockReviews.filter((r) => r.toUserId === user.id)

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Репутация</h1>
        <p className="text-sm text-muted-foreground mt-1">Ваш вклад в сообщество и признание</p>
      </div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 overflow-hidden relative"
      >
        {/* Background glow */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: level.color }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${level.color}15`, border: `1px solid ${level.color}30` }}
          >
            <Award className="w-10 h-10" style={{ color: level.color }} />
          </div>

          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ваш уровень</p>
            <h2 className="text-3xl font-bold" style={{ color: level.color }}>{level.label}</h2>
            <p className="text-lg font-semibold mt-1">{user.reputation} баллов репутации</p>

            {nextLevel && (
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Прогресс</span>
                  <span>{Math.round(progressToNext)}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${level.color}, ${nextLevel.color})` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Ещё {nextLevel.minPoints - user.reputation} баллов до уровня "{nextLevel.label}"
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Levels roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Уровни репутации
        </h3>
        <div className="space-y-3">
          {levels.map(([key, lvl], i) => {
            const isActive = key === user.reputationLevel
            const isPassed = currentLevelIdx > i
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all',
                  isActive ? 'bg-muted ring-1' : isPassed ? 'opacity-60' : 'opacity-40',
                )}
                style={isActive ? { outline: `1px solid ${lvl.color}30` } : undefined}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${lvl.color}15` }}
                >
                  <Star className="w-5 h-5" style={{ color: lvl.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={isActive || isPassed ? { color: lvl.color } : undefined}>
                    {lvl.label}
                  </p>
                  <p className="text-xs text-muted-foreground">от {lvl.minPoints} баллов</p>
                </div>
                {isActive && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    Текущий
                  </span>
                )}
                {isPassed && (
                  <span className="text-xs text-muted-foreground">Пройден</span>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Бейджи
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allBadges.map((badge) => {
            const info = BADGE_INFO[badge]
            const Icon = badgeIcons[badge]
            const earned = user.badges.includes(badge)
            return (
              <div
                key={badge}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-all',
                  earned
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-border bg-card opacity-40'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  earned ? 'bg-emerald-500/20' : 'bg-muted'
                )}>
                  <Icon className={cn('w-5 h-5', earned ? 'text-emerald-400' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                  {earned && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-emerald-400">Получен</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent thanks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" /> Благодарности
        </h3>
        {userReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Пока нет благодарностей. Помогите кому-нибудь!
          </p>
        ) : (
          <div className="space-y-3">
            {userReviews.map((review) => {
              const reviewer = mockUsers.find((u) => u.id === review.fromUserId)
              return (
                <div key={review.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface">
                  {reviewer?.avatar ? (
                    <img src={reviewer.avatar} alt="" className="w-8 h-8 rounded-full bg-muted" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] font-bold">
                      {reviewer ? getInitials(reviewer.name) : '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{reviewer?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{review.text}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-500/10 text-pink-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(review.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
