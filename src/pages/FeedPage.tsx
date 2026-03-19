import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, LayoutGrid, List, Inbox } from 'lucide-react'
import { cn, pluralize } from '@/lib/utils'
import { useTaskStore } from '@/stores/taskStore'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'

export default function FeedPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks)
  const tasks = getFilteredTasks()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Лента задач</h1>
          {!isLoading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-sm text-muted-foreground"
            >
              {tasks.length === 0 ? 'Нет задач' : pluralize(tasks.length, 'задача', 'задачи', 'задач')}
            </motion.p>
          )}
        </div>

        <Link
          to="/create-task"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Создать задачу
        </Link>
      </div>

      {/* Filters + View Toggle */}
      <div className="mb-6 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <TaskFilters />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Задачи не найдены"
          description="Попробуйте изменить фильтры или создайте новую задачу."
          action={
            <Link
              to="/create-task"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <PlusCircle className="w-4 h-4" /> Создать задачу
            </Link>
          }
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
          {tasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
