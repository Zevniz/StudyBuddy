import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Settings,
  Eye,
  Globe,
  MapPin,
  Calendar,
  Users,
  ArrowRightLeft,
  Save,
  Send,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
import type { TaskCategory, TaskUrgency } from '@/types'

const steps = [
  { id: 1, label: 'Основное', icon: FileText },
  { id: 2, label: 'Детали', icon: Settings },
  { id: 3, label: 'Предпросмотр', icon: Eye },
]

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const addTask = useTaskStore((s) => s.addTask)
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const [step, setStep] = useState(1)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>('programming')
  const [urgency, setUrgency] = useState<TaskUrgency>('medium')
  const [format, setFormat] = useState<'online' | 'offline'>('online')
  const [location, setLocation] = useState('')
  const [deadline, setDeadline] = useState('')
  const [maxExecutors, setMaxExecutors] = useState(1)
  const [allowExchange, setAllowExchange] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Укажите заголовок'
    if (!description.trim()) newErrors.description = 'Укажите описание'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!deadline) newErrors.deadline = 'Укажите дедлайн'
    if (format === 'offline' && !location.trim()) newErrors.location = 'Укажите расположение'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => Math.min(s + 1, 3))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handlePublish = () => {
    if (!user || isSubmitting) return
    setIsSubmitting(true)
    addTask({
      id: `task-${Date.now()}`,
      title,
      description,
      category,
      urgency,
      status: 'open',
      format,
      location: format === 'offline' ? location : undefined,
      deadline,
      authorId: user.id,
      maxExecutors,
      acceptedExecutors: [],
      responses: [],
      allowExchange,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    addToast({ title: 'Задача опубликована!', description: 'Ваша задача появилась в ленте', type: 'success' })
    navigate('/feed')
  }

  const handleSaveDraft = () => {
    addToast({ title: 'Черновик сохранён', type: 'info' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Создать задачу</h1>
        <p className="text-sm text-muted-foreground">Опишите, с чем вам нужна помощь</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => {
                if (s.id < step) setStep(s.id)
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1',
                step === s.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : step > s.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
              )}
            >
              {step > s.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn('w-8 h-px', step > s.id ? 'bg-emerald-500/30' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок задачи</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Помощь с линейной алгеброй"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all',
                    errors.title
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                      : 'border-border focus:border-emerald-500 focus:ring-emerald-500/30'
                  )}
                />
                {errors.title && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробно опишите, что именно нужно сделать..."
                  rows={5}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all resize-none',
                    errors.description
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                      : 'border-border focus:border-emerald-500 focus:ring-emerald-500/30'
                  )}
                />
                {errors.description && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.description}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [TaskCategory, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        category === key
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline w-4 h-4 mr-1.5" /> Дедлайн
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-muted border text-sm text-foreground focus:outline-none focus:ring-1 transition-all',
                    errors.deadline
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                      : 'border-border focus:border-emerald-500 focus:ring-emerald-500/30'
                  )}
                />
                {errors.deadline && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.deadline}
                  </p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium mb-2">Срочность</label>
                <div className="flex gap-2">
                  {(Object.entries(URGENCY_LABELS) as [TaskUrgency, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUrgency(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1',
                        urgency === key
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Формат</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('online')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-1',
                      format === 'online'
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Globe className="w-4 h-4" /> Онлайн
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('offline')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex-1',
                      format === 'offline'
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MapPin className="w-4 h-4" /> Оффлайн
                  </button>
                </div>
              </div>

              {/* Location (conditional) */}
              <AnimatePresence>
                {format === 'offline' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="inline w-4 h-4 mr-1.5" /> Расположение
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Адрес или место встречи"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all',
                        errors.location
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                          : 'border-border focus:border-emerald-500 focus:ring-emerald-500/30'
                      )}
                    />
                    {errors.location && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.location}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Max executors */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="inline w-4 h-4 mr-1.5" /> Количество исполнителей
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxExecutors(n)}
                      className={cn(
                        'w-12 h-12 rounded-xl text-sm font-bold transition-all',
                        maxExecutors === n
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {maxExecutors === 1 ? 'Один исполнитель' : `До ${maxExecutors} исполнителей`}
                </p>
              </div>

              {/* Exchange toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium">Обмен задачами</p>
                    <p className="text-xs text-muted-foreground">Разрешить предлагать обмен помощью</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowExchange(!allowExchange)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    allowExchange ? 'bg-emerald-500' : 'bg-zinc-700'
                  )}
                >
                  <motion.div
                    animate={{ x: allowExchange ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Предпросмотр задачи</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Заголовок</p>
                  <p className="text-base font-medium mt-1">{title || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Описание</p>
                  <p className="text-sm text-foreground/80 mt-1">{description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Категория</p>
                    <p className="text-sm mt-1">{CATEGORY_LABELS[category]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Срочность</p>
                    <p className="text-sm mt-1">{URGENCY_LABELS[urgency]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Формат</p>
                    <p className="text-sm mt-1">{format === 'online' ? 'Онлайн' : 'Оффлайн'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Дедлайн</p>
                    <p className="text-sm mt-1">{deadline || '—'}</p>
                  </div>
                  {format === 'offline' && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Расположение</p>
                      <p className="text-sm mt-1">{location || '—'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Исполнители</p>
                    <p className="text-sm mt-1">{maxExecutors === 1 ? '1 человек' : `До ${maxExecutors} человек`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Обмен</p>
                    <p className="text-sm mt-1">{allowExchange ? 'Разрешён' : 'Нет'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div>
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {step === 3 && (
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted hover:bg-accent transition-all"
            >
              <Save className="w-4 h-4" /> Черновик
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              Далее <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" /> {isSubmitting ? 'Публикация...' : 'Опубликовать'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
