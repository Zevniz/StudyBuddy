import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoFull } from '@/components/shared/Logo'
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

type Tab = 'login' | 'register'
type ViewState = 'auth' | 'onboarding' | 'email-sent'

interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  name: string
  email: string
  password: string
  university: string
  faculty: string
}

const floatingOrbs = [
  { size: 320, x: '15%', y: '20%', color: 'from-emerald-600/30 to-teal-600/20', delay: 0, duration: 18 },
  { size: 260, x: '75%', y: '15%', color: 'from-teal-600/25 to-cyan-500/15', delay: 2, duration: 22 },
  { size: 200, x: '60%', y: '70%', color: 'from-green-600/20 to-emerald-600/15', delay: 4, duration: 20 },
  { size: 180, x: '25%', y: '75%', color: 'from-teal-600/25 to-emerald-500/15', delay: 1, duration: 16 },
  { size: 140, x: '85%', y: '55%', color: 'from-emerald-500/20 to-teal-500/10', delay: 3, duration: 24 },
]

const inputClasses =
  'w-full bg-muted border border-border rounded-xl px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-emerald-500/50 focus:bg-muted focus:ring-1 focus:ring-emerald-500/25'

const labelClasses = 'block text-sm font-medium text-foreground/50 mb-1.5'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  const { addToast } = useUIStore()

  const [activeTab, setActiveTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('auth')
  const [bio, setBio] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    university: '',
    faculty: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateRegister = () => {
    const newErrors: Record<string, string> = {}
    if (registerForm.name.length < 2) newErrors.name = 'Минимум 2 символа'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.email)) newErrors.email = 'Введите корректный email'
    if (registerForm.password.length < 8) {
      newErrors.password = 'Минимум 8 символов'
    } else if (!/[A-ZА-ЯЁ]/.test(registerForm.password)) {
      newErrors.password = 'Нужна хотя бы одна заглавная буква'
    } else if (!/\d/.test(registerForm.password)) {
      newErrors.password = 'Нужна хотя бы одна цифра'
    }
    if (!registerForm.university) newErrors.university = 'Укажите университет'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      await login(loginForm.email, loginForm.password)
      addToast({ title: 'С возвращением!', description: 'Вы успешно вошли в аккаунт.', type: 'success' })
      navigate('/feed')
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'INVALID_CREDENTIALS') {
        setErrors({ login: 'Неверный email или пароль. Проверьте данные.' })
      } else if (code === 'EMAIL_NOT_CONFIRMED') {
        setErrors({ login: 'Email не подтверждён. Проверьте почту.' })
      } else if (code === 'EMAIL_LOGINS_DISABLED') {
        setErrors({ login: 'Вход по email временно недоступен. Обратитесь к администратору.' })
      } else if (code === 'TIMEOUT') {
        setErrors({ login: 'Сервер не отвечает. Попробуйте позже.' })
      } else {
        setErrors({ login: 'Ошибка входа. Попробуйте снова.' })
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateRegister()) return

    try {
      const result = await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        university: registerForm.university,
        faculty: registerForm.faculty,
      })

      if (result.needsConfirmation) {
        // Email confirmation отключён в Supabase, но на случай если включат обратно
        setRegisteredEmail(registerForm.email)
        setViewState('email-sent')
      } else {
        // Сессия создана сразу — переходим в onboarding
        setViewState('onboarding')
      }
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'USER_ALREADY_EXISTS') {
        setErrors({ register: 'Аккаунт с таким email уже существует. Войдите в систему.' })
      } else if (code === 'EMAIL_LOGINS_DISABLED') {
        setErrors({ register: 'Регистрация по email временно недоступна. Обратитесь к администратору.' })
      } else if (code === 'EMAIL_SERVICE_ERROR') {
        setErrors({ register: 'Ошибка отправки email. Попробуйте позже.' })
      } else if (code === 'TIMEOUT') {
        setErrors({ register: 'Сервер не отвечает. Попробуйте позже.' })
      } else {
        const message = err instanceof Error ? err.message : 'Попробуйте снова.'
        addToast({ title: 'Ошибка регистрации', description: message, type: 'error' })
      }
    }
  }

  const handleOnboardingComplete = () => {
    if (bio.trim()) {
      useAuthStore.getState().updateProfile({ bio })
    }
    addToast({ title: 'Добро пожаловать в StudyBuddy!', description: 'Ваш аккаунт готов.', type: 'success' })
    navigate('/feed')
  }

  const formVariants = {
    initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -20, filter: 'blur(4px)' },
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-background to-teal-950/30" />
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-3xl`}
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
            animate={{
              x: [0, 30, -20, 10, 0],
              y: [0, -25, 15, -10, 0],
              scale: [1, 1.1, 0.95, 1.05, 1],
            }}
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-md mx-4 border border-border rounded-2xl p-8 backdrop-blur-xl bg-card shadow-2xl shadow-black/40"
      >
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center gap-2.5 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <LogoFull iconSize={36} />
        </motion.div>

        <AnimatePresence mode="wait">
          {viewState === 'email-sent' ? (
            /* Email Confirmation Sent */
            <motion.div
              key="email-sent"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <h2 className="text-xl font-semibold text-foreground mb-2">Проверьте почту!</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Мы отправили письмо с подтверждением на
              </p>
              <p className="text-sm font-medium text-emerald-500 mb-6">{registeredEmail}</p>
              <p className="text-xs text-muted-foreground mb-6">
                Нажмите на ссылку в письме, чтобы активировать аккаунт. После подтверждения вы сможете войти.
              </p>

              <motion.button
                onClick={() => {
                  setViewState('auth')
                  setActiveTab('login')
                  setLoginForm({ email: registeredEmail, password: '' })
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-shadow hover:shadow-emerald-600/40"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Перейти ко входу
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : viewState === 'onboarding' ? (
            /* Onboarding Step */
            <motion.div
              key="onboarding"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">Почти готово!</h2>
                <p className="text-sm text-muted-foreground">Расскажите немного о себе</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>О себе</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Студент, увлекаюсь..."
                      rows={4}
                      className={`${inputClasses} resize-none pt-3`}
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleOnboardingComplete}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-shadow hover:shadow-emerald-600/40"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Начать
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={handleOnboardingComplete}
                  className="w-full text-center text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
                >
                  Пропустить
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Tab switcher */}
              <div className="relative flex bg-muted rounded-xl p-1 mb-8">
                {(['login', 'register'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setErrors({}) }}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60'
                    }`}
                  >
                    {tab === 'login' ? 'Войти' : 'Регистрация'}
                  </button>
                ))}
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-1 bottom-1 rounded-lg bg-accent border border-border"
                  style={{ width: 'calc(50% - 4px)' }}
                  animate={{ left: activeTab === 'login' ? 4 : 'calc(50% + 0px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {activeTab === 'login' ? (
                  <motion.form
                    key="login-form"
                    onSubmit={handleLogin}
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className={labelClasses}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => { setLoginForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, login: '' })) }}
                          placeholder="you@university.edu"
                          required
                          className={`${inputClasses} ${errors.login ? 'border-red-500/50' : ''}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Пароль</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginForm.password}
                          onChange={(e) => { setLoginForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, login: '' })) }}
                          placeholder="Введите пароль"
                          required
                          className={`${inputClasses} ${errors.login ? 'border-red-500/50' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground/50 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {errors.login && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
                      >
                        <p className="text-sm text-red-500 font-medium">{errors.login}</p>
                        {errors.login.includes('email или пароль') && (
                          <button
                            type="button"
                            onClick={() => { setActiveTab('register'); setErrors({}); setRegisterForm(f => ({ ...f, email: loginForm.email })) }}
                            className="text-sm text-emerald-500 hover:text-emerald-400 font-medium mt-1.5 transition-colors"
                          >
                            Нет аккаунта? Зарегистрироваться →
                          </button>
                        )}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:shadow-emerald-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
                      whileHover={isLoading ? {} : { scale: 1.01 }}
                      whileTap={isLoading ? {} : { scale: 0.98 }}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        <>
                          Войти
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register-form"
                    onSubmit={handleRegister}
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className={labelClasses}>Имя</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => { setRegisterForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: '' })) }}
                          placeholder="Иван Иванов"
                          required
                          className={`${inputClasses} ${errors.name ? 'border-red-500/50' : ''}`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => { setRegisterForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: '' })) }}
                          placeholder="you@university.edu"
                          required
                          className={`${inputClasses} ${errors.email ? 'border-red-500/50' : ''}`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Пароль</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={registerForm.password}
                          onChange={(e) => { setRegisterForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, password: '' })) }}
                          placeholder="Минимум 8 символов, заглавная и цифра"
                          required
                          className={`${inputClasses} ${errors.password ? 'border-red-500/50' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground/50 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Университет</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={registerForm.university}
                          onChange={(e) => { setRegisterForm((f) => ({ ...f, university: e.target.value })); setErrors((er) => ({ ...er, university: '' })) }}
                          placeholder="МГУ, МФТИ, ВШЭ..."
                          required
                          className={`${inputClasses} ${errors.university ? 'border-red-500/50' : ''}`}
                        />
                      </div>
                      {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Факультет</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={registerForm.faculty}
                          onChange={(e) => setRegisterForm((f) => ({ ...f, faculty: e.target.value }))}
                          placeholder="Факультет информатики"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {errors.register && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
                      >
                        <p className="text-sm text-red-500 font-medium">{errors.register}</p>
                        {errors.register.includes('Войдите') && (
                          <button
                            type="button"
                            onClick={() => { setActiveTab('login'); setErrors({}); setLoginForm(f => ({ ...f, email: registerForm.email })) }}
                            className="text-sm text-emerald-500 hover:text-emerald-400 font-medium mt-1.5 transition-colors"
                          >
                            Перейти ко входу →
                          </button>
                        )}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:shadow-emerald-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
                      whileHover={isLoading ? {} : { scale: 1.01 }}
                      whileTap={isLoading ? {} : { scale: 0.98 }}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        <>
                          Создать аккаунт
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
