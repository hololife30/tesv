import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Home,
  Menu,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import videoBg from './images/vid.mp4'
import profile1 from './profile/1.jpg'
import profile2 from './profile/2.jpg'
import profile3 from './profile/3.jpg'
import profile4 from './profile/4.jpg'
import profile5 from './profile/5.jpg'
import profile6 from './profile/6.jpg'
import profile7 from './profile/7.jpg'
import profile8 from './profile/8.jpg'
import profile9 from './profile/9.jpg'
import profile10 from './profile/10.jpg'
import profile11 from './profile/11.jpg'
import profile12 from './profile/12.jpg'

type Team = {
  id: number
  name: string
  members: number
  tone: 'teal' | 'mint'
  number: string
}

type Player = { id: number; name: string; avatar: string }
type AppView = 'teams' | 'users' | 'calculator' | 'menu'

const profileImages = [
  profile1,
  profile2,
  profile3,
  profile4,
  profile5,
  profile6,
  profile7,
  profile8,
  profile9,
  profile10,
  profile11,
  profile12,
]

const shuffleImages = <T,>(items: T[]) => {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }
  return next
}

const initialAvatarQueue = shuffleImages(profileImages)

const initialTeams: Team[] = [
  { id: 1, name: 'Team A', members: 5, tone: 'teal', number: '1' },
  { id: 2, name: 'Team B', members: 4, tone: 'mint', number: '1' },
  { id: 3, name: 'Team C', members: 3, tone: 'teal', number: '1' },
  { id: 4, name: 'Team D', members: 2, tone: 'mint', number: '1' },
]

const initialPlayers: Player[] = [
  { id: 1, name: 'Ajay', avatar: initialAvatarQueue[0] },
  { id: 2, name: 'Arjun', avatar: initialAvatarQueue[1] },
  { id: 3, name: 'Binu', avatar: initialAvatarQueue[2] },
]

const STORAGE_KEY = 'futsal-teams-state'

type SavedState = {
  teams: Team[]
  players: Player[]
  avatarQueue: string[]
  teamPlayerIds: Record<number, number[]>
}

const loadSavedState = (): SavedState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as SavedState : null
  } catch {
    return null
  }
}

function TeamCard({
  team,
  assignedPlayers,
  isMenuOpen,
  isEditing,
  draftName,
  onToggleMenu,
  onRename,
  onDraftNameChange,
  onSaveRename,
  onCancelRename,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onCloseMenu,
  onOpenTeam,
}: {
  team: Team
  assignedPlayers: Player[]
  isMenuOpen: boolean
  isEditing: boolean
  draftName: string
  onToggleMenu: (teamId: number) => void
  onRename: (teamId: number) => void
  onDraftNameChange: (name: string) => void
  onSaveRename: () => void
  onCancelRename: () => void
  onRemove: (teamId: number) => void
  onDragStart: (teamId: number) => void
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDrop: (teamId: number) => void
  onCloseMenu: () => void
  onOpenTeam: (teamId: number) => void
}) {
  return (
    <article
      className="team-card compact-team-card"
      draggable
      tabIndex={0}
      onDragStart={() => onDragStart(team.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(team.id)}
      onClick={() => onOpenTeam(team.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpenTeam(team.id)
      }}
    >
      <div className="team-card-top">
        <div className="team-card-inner">
          {isEditing ? (
            <div className="team-name-edit">
              <input
                className="team-name-input"
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSaveRename()
                  if (event.key === 'Escape') onCancelRename()
                }}
                aria-label="Team name"
                autoFocus
              />
              <button type="button" className="team-name-cancel" aria-label="Cancel rename" onClick={onCancelRename}>
                <X size={15} />
              </button>
            </div>
          ) : (
            <h3>{team.name}</h3>
          )}
          <p>{assignedPlayers.length} Players</p>
          <div className="member-row">
            {assignedPlayers.map((player) => (
              <img
                className="small-avatar"
                src={player.avatar || profileImages[0]}
                alt={`${player.name} avatar`}
                key={`${team.id}-${player.id}`}
                onError={(event) => {
                  event.currentTarget.src = profileImages[0]
                }}
              />
            ))}
          </div>
        </div>
        <div className="team-menu-wrap">
          <button type="button" className="menu-dots" aria-label={`More options for ${team.name}`} onClick={(event) => { event.stopPropagation(); onToggleMenu(team.id) }}>
            <span /><span /><span />
          </button>
          {isMenuOpen && (
            <div className="team-menu" role="menu" aria-label={`Actions for ${team.name}`} onClick={(event) => event.stopPropagation()}>
              <button type="button" aria-label="Rename team" onClick={() => { onRename(team.id); onCloseMenu() }}><Pencil size={16} /></button>
              <button type="button" aria-label="Remove team" onClick={() => { onRemove(team.id); onCloseMenu() }}><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function TeamDetailView({ team, players, assignedPlayerIds, allAssignedPlayerIds, onBack, onAddPlayer, onRemovePlayer, onClearAll }: {
  team: Team
  players: Player[]
  assignedPlayerIds: number[]
  allAssignedPlayerIds: number[]
  onBack: () => void
  onAddPlayer: (playerId: number) => void
  onRemovePlayer: (playerId: number) => void
  onClearAll: () => void
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false)
  const assignedPlayers = players.filter((player) => assignedPlayerIds.includes(player.id))
  const availablePlayers = players.filter((player) => !allAssignedPlayerIds.includes(player.id))
  const selectedPlayer = availablePlayers.find((player) => String(player.id) === selectedPlayerId)

  const handleAdd = () => {
    if (!selectedPlayerId) return
    onAddPlayer(Number(selectedPlayerId))
    setSelectedPlayerId('')
    setIsPlayerPickerOpen(false)
  }

  return (
    <section className="team-detail" aria-label={`${team.name} players`}>
      <button type="button" className="detail-back" onClick={onBack}><ArrowLeft size={18} /><span>Back</span></button>
      <div className="detail-heading"><h2>{team.name}</h2><p>Add players to this team</p></div>
      <div className="player-picker">
        <div className="player-select-row">
          <div className="player-select-wrap">
            <button type="button" className={`player-select-trigger ${isPlayerPickerOpen ? 'player-select-trigger-open' : ''}`} onClick={() => setIsPlayerPickerOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={isPlayerPickerOpen}>
              <span>{selectedPlayer?.name ?? 'Choose a player'}</span><ChevronDown size={17} />
            </button>
            {isPlayerPickerOpen && (
              <div className="player-options" role="listbox" aria-label="Available players">
                {availablePlayers.length === 0 ? <p className="player-options-empty">All players added</p> : availablePlayers.map((player) => (
                  <button type="button" className={`player-option ${selectedPlayerId === String(player.id) ? 'player-option-selected' : ''}`} role="option" aria-selected={selectedPlayerId === String(player.id)} key={player.id} onClick={() => { setSelectedPlayerId(String(player.id)); setIsPlayerPickerOpen(false) }}>
                    <img
                      className="small-avatar"
                      src={player.avatar || profileImages[0]}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.src = profileImages[0]
                      }}
                    /><span>{player.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="player-add-button" onClick={handleAdd} disabled={!selectedPlayerId}>Add</button>
        </div>
      </div>
      <div className="assigned-players">
        <div className="assigned-heading">
          <h3>Team players</h3>
          {assignedPlayers.length > 0 && <button type="button" className="clear-all-button" onClick={onClearAll}>Clear all</button>}
        </div>
        {assignedPlayers.length === 0 ? <p className="empty-users">No players added yet.</p> : assignedPlayers.map((player) => (
          <div className="assigned-player-row" key={player.id}>
            <img
              className="small-avatar"
              src={player.avatar || profileImages[0]}
              alt=""
              onError={(event) => {
                event.currentTarget.src = profileImages[0]
              }}
            />
            <span>{player.name}</span>
            <button type="button" aria-label={`Remove ${player.name} from ${team.name}`} onClick={() => onRemovePlayer(player.id)}><X size={16} /></button>
          </div>
        ))}
      </div>
    </section>
  )
}

function UsersView({ players, editingPlayerId, draftPlayerName, onStartEdit, onDraftNameChange, onSaveEdit, onCancelEdit, onRemove }: {
  players: Player[]
  editingPlayerId: number | null
  draftPlayerName: string
  onStartEdit: (player: Player) => void
  onDraftNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onRemove: (playerId: number) => void
}) {
  const groupedPlayers = [...players].sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })).reduce<Record<string, Player[]>>((groups, player) => {
    const letter = player.name.trim().charAt(0).toUpperCase() || '#'
    groups[letter] = groups[letter] ? [...groups[letter], player] : [player]
    return groups
  }, {})

  return (
    <div className="users-list" aria-label="Players">
      {Object.entries(groupedPlayers).sort(([first], [second]) => first.localeCompare(second)).map(([letter, group]) => (
        <section className="player-group" key={letter}>
          <h3 className="player-group-letter">{letter}</h3>
          <div className="player-group-items">
            {group.map((player) => (
              <div className="player-row" key={player.id}>
                {editingPlayerId === player.id ? (
                  <div className="player-name-edit">
                    <input className="player-name-input" value={draftPlayerName} onChange={(event) => onDraftNameChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSaveEdit(); if (event.key === 'Escape') onCancelEdit() }} placeholder="Name" aria-label="Player name" autoFocus />
                    <button type="button" className="player-save" aria-label="Save player name" onClick={onSaveEdit}><Check size={15} /></button>
                  </div>
                ) : <span className="player-name">{player.name}</span>}
                <div className="player-actions"><button type="button" aria-label={`Edit ${player.name}`} onClick={() => onStartEdit(player)}><Pencil size={15} /></button><button type="button" aria-label={`Remove ${player.name}`} onClick={() => onRemove(player.id)}><Trash2 size={15} /></button></div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {players.length === 0 && <p className="empty-users">No players yet. Tap + to add one.</p>}
    </div>
  )
}

function CalculatorView() {
  const [expression, setExpression] = useState('')
  const [display, setDisplay] = useState('0')
  const [isError, setIsError] = useState(false)

  const appendValue = (value: string) => {
    if (isError) {
      setExpression(value)
      setDisplay(value)
      setIsError(false)
      return
    }

    if (value === '.' && /[\d.]$/.test(expression) && expression.includes('.')) {
      return
    }

    const nextExpression = expression + value
    setExpression(nextExpression)
    setDisplay(nextExpression || '0')
  }

  const appendOperator = (operator: string) => {
    if (isError) {
      setExpression('')
      setDisplay('0')
      setIsError(false)
    }

    if (!expression) return
    const lastChar = expression.slice(-1)
    if (['+', '-', '*', '/'].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + operator)
      setDisplay(expression.slice(0, -1) + operator)
      return
    }

    const nextExpression = expression + operator
    setExpression(nextExpression)
    setDisplay(nextExpression)
  }

  const handleClear = () => {
    setExpression('')
    setDisplay('0')
    setIsError(false)
  }

  const handleDelete = () => {
    if (isError) {
      handleClear()
      return
    }

    const nextExpression = expression.slice(0, -1)
    setExpression(nextExpression)
    setDisplay(nextExpression || '0')
  }

  const handleEqual = () => {
    if (!expression) return

    try {
      const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      const result = Function(`"use strict"; return (${sanitized});`)()

      if (!Number.isFinite(result)) {
        throw new Error('Invalid calculation')
      }

      const formatted = Number.isInteger(result) ? String(result) : Number(result.toFixed(6)).toString()
      setExpression(formatted)
      setDisplay(formatted)
      setIsError(false)
    } catch {
      setExpression('')
      setDisplay('Error')
      setIsError(true)
    }
  }

  return (
    <section className="calculator-page" aria-label="Calculator">
      <div className="calculator-shell">
        <div className="calculator-display">
          <span className="calculator-expression">{expression || '0'}</span>
          <strong className="calculator-result">{display}</strong>
        </div>

        <div className="calculator-keypad">
          <button type="button" className="calculator-btn calculator-btn-utility" onClick={handleClear}>C</button>
          <button type="button" className="calculator-btn calculator-btn-utility" onClick={handleDelete}>⌫</button>
          <button type="button" className="calculator-btn calculator-btn-operator" onClick={() => appendOperator('/')}>&divide;</button>
          <button type="button" className="calculator-btn calculator-btn-operator" onClick={() => appendOperator('*')}>&times;</button>

          <button type="button" className="calculator-btn" onClick={() => appendValue('7')}>7</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('8')}>8</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('9')}>9</button>
          <button type="button" className="calculator-btn calculator-btn-operator" onClick={() => appendOperator('-')}>−</button>

          <button type="button" className="calculator-btn" onClick={() => appendValue('4')}>4</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('5')}>5</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('6')}>6</button>
          <button type="button" className="calculator-btn calculator-btn-operator" onClick={() => appendOperator('+')}>+</button>

          <button type="button" className="calculator-btn" onClick={() => appendValue('1')}>1</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('2')}>2</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('3')}>3</button>
          <button type="button" className="calculator-btn calculator-btn-equals" onClick={handleEqual}>=</button>

          <button type="button" className="calculator-btn calculator-btn-zero" onClick={() => appendValue('0')}>0</button>
          <button type="button" className="calculator-btn" onClick={() => appendValue('.')}>.</button>
        </div>

      </div>
    </section>
  )
}

function ShareView({ teams, players, teamPlayerIds }: {
  teams: Team[]
  players: Player[]
  teamPlayerIds: Record<number, number[]>
}) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const selectedTeams = teams.filter((team) => selectedTeamIds.includes(team.id))

  const getTeamPlayers = (teamId: number) => {
    const assignedIds = teamPlayerIds[teamId] ?? []
    return players.filter((player) => assignedIds.includes(player.id))
  }

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((current) => current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId])
  }

  const shareText = selectedTeams.map((team) => {
    const teamPlayers = getTeamPlayers(team.id)
    return `${team.name}\n${teamPlayers.length > 0 ? teamPlayers.map((player) => player.name).join('\n') : 'No players added'}`
  }).join('\n\n')

  const handleCopy = async () => {
    if (!shareText) return
    await navigator.clipboard?.writeText(shareText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="share-page" aria-label="Copy teams">
      <div className="share-page-heading">
      </div>
      <div className="share-team-picker">
        {teams.map((team) => (
          <button type="button" key={team.id} className={`share-team-option ${selectedTeamIds.includes(team.id) ? 'share-team-option-selected' : ''}`} onClick={() => toggleTeam(team.id)} aria-pressed={selectedTeamIds.includes(team.id)}>
            <span className="share-team-check">{selectedTeamIds.includes(team.id) ? '✓' : ''}</span>
            <span>{team.name}</span>
          </button>
        ))}
      </div>
      <div className="share-preview">
        {selectedTeams.length === 0 ? <p className="empty-users">Choose a team to preview its players.</p> : selectedTeams.map((team) => (
          <div className="share-preview-team" key={team.id}>
            <strong>{team.name}</strong>
            {getTeamPlayers(team.id).length > 0 ? getTeamPlayers(team.id).map((player) => <span key={player.id}>{player.name}</span>) : <span>No players added</span>}
          </div>
        ))}
      </div>
      <button type="button" className="share-action-button" disabled={selectedTeams.length === 0} onClick={handleCopy}>{copied ? 'Copied' : 'Copy selected teams'}</button>
    </section>
  )
}

function FloatingNavbar({ view, onViewChange, onAdd }: { view: AppView; onViewChange: (view: AppView) => void; onAdd: () => void }) {
  return <div className="floating-nav-wrap"><nav className="floating-nav" aria-label="Main navigation">
    <button type="button" className={`floating-nav-item ${view === 'teams' ? 'floating-nav-item-active' : ''}`} aria-label="Home" onClick={() => onViewChange('teams')}><Home className="floating-nav-icon" /></button>
    <button type="button" className={`floating-nav-item ${view === 'users' ? 'floating-nav-item-active' : ''}`} aria-label="Users" onClick={() => onViewChange('users')}><Users className="floating-nav-icon" /></button>
    <button type="button" className="floating-nav-item floating-nav-center" aria-label="Add" onClick={onAdd}><Plus className="floating-nav-icon center-icon" /></button>
    <button type="button" className={`floating-nav-item ${view === 'calculator' ? 'floating-nav-item-active' : ''}`} aria-label="Calculator" onClick={() => onViewChange('calculator')}><Calculator className="floating-nav-icon" /></button>
    <button type="button" className={`floating-nav-item ${view === 'menu' ? 'floating-nav-item-active' : ''}`} aria-label="Menu" onClick={() => onViewChange('menu')}><Menu className="floating-nav-icon" /></button>
  </nav></div>
}

function App() {
  const savedState = loadSavedState()
  const [view, setView] = useState<AppView>('teams')
  const [teams, setTeams] = useState<Team[]>(() => savedState?.teams ?? initialTeams)
  const [players, setPlayers] = useState<Player[]>(() => savedState?.players ?? initialPlayers)
  const [avatarQueue, setAvatarQueue] = useState<string[]>(() => savedState?.avatarQueue ?? initialAvatarQueue.slice(3))
  const [teamPlayerIds, setTeamPlayerIds] = useState<Record<number, number[]>>(() => savedState?.teamPlayerIds ?? {})
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
  const [draftPlayerName, setDraftPlayerName] = useState('')
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const closeMenu = () => setOpenMenuId(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ teams, players, avatarQueue, teamPlayerIds }))
  }, [teams, players, avatarQueue, teamPlayerIds])

  useEffect(() => {
    if (openMenuId === null) return
    const handler = (event: MouseEvent) => {
      const target = event.target as Node
      const menu = document.querySelector('.team-menu')
      const dots = document.querySelectorAll('.menu-dots')
      if (!menu?.contains(target) && !Array.from(dots).some((button) => button.contains(target))) closeMenu()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const handleAddCard = () => setTeams((current) => {
    const index = current.length
    return [...current, { id: Date.now() + Math.random(), name: `Team ${String.fromCharCode(65 + index)}`, members: 1, tone: index % 2 === 0 ? 'teal' : 'mint', number: '1' }]
  })
  const handleAddPlayer = () => {
    const playerId = Date.now() + Math.random()
    const availableQueue = avatarQueue.length > 0 ? avatarQueue : shuffleImages(profileImages)
    const [nextAvatar, ...remaining] = availableQueue
    const queueForNext = remaining.length > 0 ? remaining : shuffleImages(profileImages)

    setAvatarQueue(queueForNext)

    const player = { id: playerId, name: '', avatar: nextAvatar ?? profileImages[0] }
    setPlayers((current) => [...current, player])
    setEditingPlayerId(player.id)
    setDraftPlayerName('')
  }
  const handleAddPlayerToTeam = (playerId: number) => {
    if (selectedTeamId === null) return
    setTeamPlayerIds((current) => {
      const assignedIds = current[selectedTeamId] ?? []
      if (assignedIds.includes(playerId)) return current
      return { ...current, [selectedTeamId]: [...assignedIds, playerId] }
    })
  }
  const handleRemovePlayerFromTeam = (playerId: number) => { if (selectedTeamId === null) return; setTeamPlayerIds((current) => ({ ...current, [selectedTeamId]: (current[selectedTeamId] ?? []).filter((id) => id !== playerId) })) }
  const handleClearAllPlayersFromTeam = () => { if (selectedTeamId === null) return; setTeamPlayerIds((current) => ({ ...current, [selectedTeamId]: [] })) }
  const handleRename = (teamId: number) => { const team = teams.find((item) => item.id === teamId); if (!team) return; setEditingTeamId(teamId); setDraftName(team.name); setOpenMenuId(null) }
  const handleSaveRename = () => { if (editingTeamId === null || !draftName.trim()) return; setTeams((current) => current.map((item) => item.id === editingTeamId ? { ...item, name: draftName.trim() } : item)); setEditingTeamId(null) }
  const handleRemove = (teamId: number) => { setTeams((current) => current.filter((team) => team.id !== teamId)); setTeamPlayerIds((current) => { const next = { ...current }; delete next[teamId]; return next }); setOpenMenuId(null) }
  const handleStartPlayerEdit = (player: Player) => { setEditingPlayerId(player.id); setDraftPlayerName(player.name) }
  const handleSavePlayerEdit = () => {
    if (editingPlayerId === null || !draftPlayerName.trim()) return
    setPlayers((current) => current.map((player) => player.id === editingPlayerId ? { ...player, name: draftPlayerName.trim() } : player))
    setEditingPlayerId(null)
  }
  const handleRemovePlayer = (playerId: number) => { setPlayers((current) => current.filter((player) => player.id !== playerId)); setTeamPlayerIds((current) => Object.fromEntries(Object.entries(current).map(([teamId, ids]) => [teamId, ids.filter((id) => id !== playerId)]))); if (editingPlayerId === playerId) setEditingPlayerId(null) }
  const handleDrop = (targetId: number) => {
    if (draggedId === null || draggedId === targetId) { setDraggedId(null); return }
    setTeams((current) => { const next = [...current]; const from = next.findIndex((team) => team.id === draggedId); const to = next.findIndex((team) => team.id === targetId); if (from === -1 || to === -1) return current; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next })
    setDraggedId(null)
  }

  return <main className="teams-screen"><video className="bg-video" autoPlay muted loop playsInline preload="auto" src={videoBg} onEnded={(event) => { event.currentTarget.currentTime = 0; event.currentTarget.play() }} /><div className="mobile-page">
    {(view !== 'teams' || selectedTeamId === null) && <header className="page-header" aria-label="Top header"><div className="page-title-wrap"><h2>{view === 'teams' ? 'Team' : view === 'users' ? 'Players' : view === 'calculator' ? 'Calculator' : 'Copy'}</h2><p>{view === 'teams' ? 'Create a team' : view === 'users' ? 'Add and manage your players' : view === 'calculator' ? 'Quick calculations' : 'Copy team players'}</p></div></header>}
    {view === 'teams' ? selectedTeamId === null ? <div className="team-grid compact-grid">{teams.map((team) => <TeamCard key={team.id} team={team} assignedPlayers={players.filter((player) => (teamPlayerIds[team.id] ?? []).includes(player.id))} isMenuOpen={openMenuId === team.id} isEditing={editingTeamId === team.id} draftName={draftName} onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)} onRename={handleRename} onDraftNameChange={setDraftName} onSaveRename={handleSaveRename} onCancelRename={() => setEditingTeamId(null)} onRemove={handleRemove} onDragStart={setDraggedId} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onCloseMenu={closeMenu} onOpenTeam={setSelectedTeamId} />)}</div> : <TeamDetailView team={teams.find((team) => team.id === selectedTeamId) ?? teams[0]} players={players.filter((player) => player.name.trim())} assignedPlayerIds={teamPlayerIds[selectedTeamId] ?? []} allAssignedPlayerIds={Object.values(teamPlayerIds).flat()} onBack={() => setSelectedTeamId(null)} onAddPlayer={handleAddPlayerToTeam} onRemovePlayer={handleRemovePlayerFromTeam} onClearAll={handleClearAllPlayersFromTeam} /> : view === 'users' ? <UsersView players={players} editingPlayerId={editingPlayerId} draftPlayerName={draftPlayerName} onStartEdit={handleStartPlayerEdit} onDraftNameChange={setDraftPlayerName} onSaveEdit={handleSavePlayerEdit} onCancelEdit={() => setEditingPlayerId(null)} onRemove={handleRemovePlayer} /> : view === 'calculator' ? <CalculatorView /> : <ShareView teams={teams} players={players} teamPlayerIds={teamPlayerIds} />}
    <FloatingNavbar view={view} onViewChange={(nextView) => { setView(nextView); setSelectedTeamId(null) }} onAdd={view === 'teams' ? handleAddCard : view === 'users' ? handleAddPlayer : () => undefined} />
  </div></main>
}

export default App
