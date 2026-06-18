import { useGameStore } from './store/gameStore';
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
import OnlineRoundResultScreen from './components/screens/OnlineRoundResultScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app">
      {screen === 'home'               && <HomeScreen />}
      {screen === 'mode-select'        && <ModeSelectScreen />}
      {screen === 'setup'              && <SetupScreen />}
      {screen === 'team-display'       && <TeamDisplayScreen />}
      {screen === 'word-card'          && <WordCardScreen />}
      {screen === 'timer'              && <TimerScreen />}
      {screen === 'round-result'       && <RoundResultScreen />}
      {screen === 'game-over'          && <GameOverScreen />}
      {screen === 'leaderboard'        && <LeaderboardScreen />}
      {screen === 'word-bank-manager'  && <WordBankManagerScreen />}
      {screen === 'settings'           && <SettingsScreen />}
      {screen === 'local-draw'         && <LocalDrawScreen />}
      {screen === 'online-lobby'       && <OnlineLobbyScreen />}
      {screen === 'waiting-room'       && <WaitingRoomScreen />}
      {screen === 'online-word-card'   && <OnlineWordCardScreen />}
      {screen === 'online-timer'       && <OnlineTimerScreen />}
      {screen === 'online-round-result' && <OnlineRoundResultScreen />}
      {screen === 'online-game-over'   && <GameOverScreen isOnline />}
    </div>
  );
}
