import { useState, useEffect } from 'react'
import { DashboardPage } from '../dashboard'
import { ScorecardPage } from '../scorecard'
import { PlanningGoalsPage } from '../planning'
import { ProgramsPage, ProgramDetailPage, ModuleViewLMS } from '../programs'
import { CreateProgramWizard, ProgramBuilderEditor } from '../program-builder'
import { CoachingPage, SessionDetailPage } from '../coaching'
import { AssessmentsPage, AssessmentDetailPage } from '../assessments'
import { PeoplePage, PersonDetailPage } from '../people'
import { AnalyticsPage } from '../analytics'
import { SettingsPage } from '../settings'
import { AgencyPage } from '../agency'
import { NotificationsPage, NotificationDropdown } from '../notifications'
import { OnboardingWizard } from '../onboarding'
import { HelpPage } from '../help'
import { SearchPage, SearchCommand } from '../search'
import { Home, BarChart3, Target, BookOpen, Wrench, Users, ClipboardList, UserCircle, PieChart, Settings, Building2, Bell, Sparkles, HelpCircle, Search, Menu, X } from 'lucide-react'

type Page = 'dashboard' | 'scorecard' | 'planning' | 'programs' | 'program-builder' | 'coaching' | 'assessments' | 'people' | 'analytics' | 'settings' | 'agency' | 'notifications' | 'help' | 'search'
type ProgramView = 'list' | 'detail' | 'lms'
type CoachingView = 'list' | 'session'
type AssessmentsView = 'list' | 'detail'
type PeopleView = 'list' | 'detail'

const navItems: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'scorecard', label: 'Scorecard', icon: BarChart3 },
  { id: 'planning', label: 'Planning & Goals', icon: Target },
  { id: 'programs', label: 'Programs', icon: BookOpen },
  { id: 'coaching', label: 'Coaching', icon: Users },
  { id: 'assessments', label: '360 Assessments', icon: ClipboardList },
  { id: 'people', label: 'People', icon: UserCircle },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'agency', label: 'Agency Portal', icon: Building2 },
  { id: 'program-builder', label: 'Program Builder', icon: Wrench },
]

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [programView, setProgramView] = useState<ProgramView>('list')
  const [coachingView, setCoachingView] = useState<CoachingView>('list')
  const [assessmentsView, setAssessmentsView] = useState<AssessmentsView>('list')
  const [peopleView, setPeopleView] = useState<PeopleView>('list')
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showBuilderEditor, setShowBuilderEditor] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleContinueProgram = (_programId: string) => {
    setProgramView('lms')
  }

  const handleViewProgram = (_programId: string) => {
    setProgramView('detail')
  }

  const handleBackToPrograms = () => {
    setProgramView('list')
  }

  const handleContinueLearning = (_moduleId: string) => {
    setProgramView('lms')
  }

  const handleCreateProgram = () => {
    setShowCreateWizard(false)
    setShowBuilderEditor(true)
  }

  const handleBackFromBuilder = () => {
    setShowBuilderEditor(false)
  }

  const handleViewSession = (_sessionId: string) => {
    setCoachingView('session')
  }

  const handleBackToCoaching = () => {
    setCoachingView('list')
  }

  const handleViewAssessment = (_assessmentId: string) => {
    setAssessmentsView('detail')
  }

  const handleBackToAssessments = () => {
    setAssessmentsView('list')
  }

  const handleViewPerson = (_personId: string) => {
    setPeopleView('detail')
  }

  const handleBackToPeople = () => {
    setPeopleView('list')
  }

  // If we're in LMS view, render full-screen without sidebar
  if (currentPage === 'programs' && programView === 'lms') {
    return (
      <ModuleViewLMS
        onBack={handleBackToPrograms}
      />
    )
  }

  // If we're in Program Builder Editor, render full-screen without sidebar
  if (currentPage === 'program-builder' && showBuilderEditor) {
    return (
      <ProgramBuilderEditor
        onBack={handleBackFromBuilder}
      />
    )
  }

  // Close sidebar when navigating on mobile
  const handleNavClick = (itemId: Page) => {
    setCurrentPage(itemId)
    setSidebarOpen(false) // Close mobile sidebar
    if (itemId === 'programs') {
      setProgramView('list')
    }
    if (itemId === 'program-builder') {
      setShowBuilderEditor(false)
    }
    if (itemId === 'coaching') {
      setCoachingView('list')
    }
    if (itemId === 'assessments') {
      setAssessmentsView('list')
    }
    if (itemId === 'people') {
      setPeopleView('list')
    }
  }

  // Sidebar content component to avoid duplication
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground text-sm font-bold">
              TR
            </div>
            <div>
              <div className="text-sm tracking-wide text-sidebar-foreground">Results Tracking</div>
              <div className="text-xs text-muted-foreground">System</div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-sidebar-foreground rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Onboarding Banner */}
      <button
        onClick={() => {
          setShowOnboarding(true)
          setSidebarOpen(false)
        }}
        className="mx-3 lg:mx-4 mt-3 lg:mt-4 p-3 bg-accent/10 rounded-lg flex items-center gap-2 hover:bg-accent/20 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-accent" />
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-sidebar-foreground">Setup Guide</div>
          <div className="text-xs text-muted-foreground">Complete your profile</div>
        </div>
        <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="w-1/4 h-full bg-accent rounded-full" />
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-3 lg:p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm">
            JD
          </div>
          <div className="flex-1">
            <div className="text-sm text-sidebar-foreground">John Doe</div>
            <div className="text-xs text-muted-foreground">Executive</div>
          </div>
          <NotificationDropdown
            onViewAll={() => {
              setCurrentPage('notifications')
              setSidebarOpen(false)
            }}
          />
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (fixed) & Mobile (drawer) */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 lg:w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-sidebar-foreground hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-accent-foreground text-xs font-bold">
              TR
            </div>
            <span className="text-sm font-medium text-sidebar-foreground">Results Tracking</span>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 -mr-2 text-muted-foreground hover:text-sidebar-foreground"
          >
            <Search className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && <DashboardPage userName="John" showOnboarding={true} />}
        {currentPage === 'scorecard' && <ScorecardPage />}
        {currentPage === 'planning' && <PlanningGoalsPage />}
        {currentPage === 'programs' && programView === 'list' && (
          <ProgramsPage
            onContinueProgram={handleContinueProgram}
            onViewProgram={handleViewProgram}
          />
        )}
        {currentPage === 'programs' && programView === 'detail' && (
          <ProgramDetailPage
            onBack={handleBackToPrograms}
            onContinue={handleContinueLearning}
          />
        )}
        {currentPage === 'program-builder' && !showBuilderEditor && (
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 sm:mb-2">Program Builder</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create and manage learning programs for your organization
                </p>
              </div>
              <button
                onClick={() => setShowCreateWizard(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Wrench className="w-4 h-4" />
                Create New Program
              </button>
            </header>

            {/* Programs List */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sidebar-foreground">Your Programs</h3>
                <span className="text-sm text-muted-foreground">1 program</span>
              </div>

              {/* Sample Program Card */}
              <div
                onClick={() => setShowBuilderEditor(true)}
                className="p-3 sm:p-4 border border-border rounded-lg hover:border-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sidebar-foreground font-medium text-sm sm:text-base truncate">LeaderShift: Manager to Leader Transformation</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Leadership Track • 12 modules • 12 weeks</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium self-start sm:self-center shrink-0">
                    Draft
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 text-xs sm:text-sm text-muted-foreground">
                  <span>28 participants</span>
                  <span>Created: Jan 15, 2025</span>
                  <span className="hidden sm:inline">Last edited: 2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentPage === 'coaching' && coachingView === 'list' && (
          <CoachingPage
            onViewSession={handleViewSession}
          />
        )}
        {currentPage === 'coaching' && coachingView === 'session' && (
          <SessionDetailPage
            onBack={handleBackToCoaching}
          />
        )}
        {currentPage === 'assessments' && assessmentsView === 'list' && (
          <AssessmentsPage
            onViewAssessment={handleViewAssessment}
          />
        )}
        {currentPage === 'assessments' && assessmentsView === 'detail' && (
          <AssessmentDetailPage
            onBack={handleBackToAssessments}
          />
        )}
        {currentPage === 'people' && peopleView === 'list' && (
          <PeoplePage
            onViewPerson={handleViewPerson}
          />
        )}
        {currentPage === 'people' && peopleView === 'detail' && (
          <PersonDetailPage
            onBack={handleBackToPeople}
          />
        )}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'agency' && <AgencyPage />}
        {currentPage === 'notifications' && <NotificationsPage />}
        {currentPage === 'help' && <HelpPage />}
        {currentPage === 'search' && <SearchPage />}
      </main>
      </div>

      {/* Create Program Wizard Modal */}
      <CreateProgramWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onCreate={handleCreateProgram}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Search Command Palette */}
      <SearchCommand
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(url) => {
          // Parse the URL to navigate to the appropriate page
          const pageMap: Record<string, Page> = {
            '/dashboard': 'dashboard',
            '/scorecard': 'scorecard',
            '/planning': 'planning',
            '/programs': 'programs',
            '/coaching': 'coaching',
            '/assessments': 'assessments',
            '/people': 'people',
            '/analytics': 'analytics',
            '/settings': 'settings',
            '/agency': 'agency',
            '/notifications': 'notifications',
            '/help': 'help',
          }
          const basePath = '/' + url.split('/')[1]
          const page = pageMap[basePath]
          if (page) {
            setCurrentPage(page)
          }
          setShowSearch(false)
        }}
      />
    </div>
  )
}

export default App
