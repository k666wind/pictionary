import { useGameStore } from './store/gameStore';
import { useNetworkStore } from './store/networkStore';
import HomeScreen from './components/screens/HomeScreen';
import ModeSelectScreen from './components/screens/ModeSelectScreen';
import SetupScreen from './components/screens/SetupScreen';
import TeamDisplayScreen from './components/screens/TeamDisplayScreen';
import WordCardScreen from './components/screens/WordCardScreen';
import TimerScreen from './components/screens/TimerScreen';
import RoundResultScreen from './components/screens/RoundResultScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen';
import WordBankManagerScreen from './components/screens/WordBankManagerScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import LocalDrawScreen from './components/screens/LocalDrawScreen';
import OnlineLobbyScreen from './components/screens/OnlineLobbyScreen';
import WaitingRoomScreen from './components/screens/WaitingRoomScreen';
import OnlineWordCardScreen from './components/screens/OnlineWordCardScreen';
import OnlineTimerScreen from './components/screens/OnlineTimerScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  // Online round-result / game-over reuse local screens
  // but we need to show network scores — handled inside those screens via props/store
  return (
    <div className="app">
      {screen === 'home'              && <HomeScreen />}
      {screen === 'mode-select'       && <ModeSelectScreen />}
      {screen === 'setup'             && <SetupScreen />}
      {screen === 'team-display'      && <TeamDisplayScreen />}
      {screen === 'word-card'         && <WordCardScreen />}
      {screen === 'timer'             && <TimerScreen />}
      {screen === 'round-result'      && <RoundResultScreen />}
      {screen === 'game-over'         && <GameOverScreen />}
      {screen === 'leaderboard'       && <LeaderboardScreen />}
      {screen === 'word-bank-manager' && <WordBankManagerScreen />}
      {screen === 'settings'          && <SettingsScreen />}
      {screen === 'local-draw'        && <LocalDrawScreen />}
      {/* Online */}
      {screen === 'online-lobby'      && <OnlineLobbyScreen />}
      {screen === 'waiting-room'      && <WaitingRoomScreen />}
      {screen === 'online-word-card'  && <OnlineWordCardScreen />}
      {screen === 'online-timer'      && <OnlineTimerScreen />}
      {/* online-round-result / online-game-over reuse local components */}
      {screen === 'online-round-result' && <RoundResultScreen isOnline />}
      {screen === 'online-game-over'    && <GameOverScreen isOnline />}
    </div>
  );
}
