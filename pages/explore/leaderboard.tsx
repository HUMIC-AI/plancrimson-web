import {
  query, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Schema from '../../src/schema';
import { alertUnexpectedError, useProfiles } from '../../src/utils/hooks';
import { GameRecord, UserProfile } from '../../src/types';
import Layout from '../../components/Layout/Layout';
import { LoadingBars } from '../../components/Layout/LoadingPage';

export default function LeaderboardPage() {
  const [games, setGames] = useState<(GameRecord & { id: string })[] | null>(null);
  const profiles = useProfiles(games?.map((g) => g.userId));

  useEffect(() => {
    const q = query(
      Schema.Collection.games(),
      orderBy('milliseconds'),
      limit(10),
    );

    return onSnapshot(q, (snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), alertUnexpectedError);
  }, []);

  return (
    <Layout title="Leaderboard">
      <div className="flex flex-col items-center space-y-4">
        <h1>Leaderboard</h1>

        {games === null ? <LoadingBars /> : (
          <table>
            <thead>
              <tr>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Rank</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">User</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Seconds</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Start</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Target</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Difficulty</th>
                <th className="bg-gray-secondary px-2 py-1 text-center font-medium">Hints</th>
              </tr>
            </thead>
            <tbody>
              {games.map(({ id, ...game }, i) => (
                <LeaderboardRow key={id} game={game} profile={profiles && profiles[game.userId]} rank={i + 1} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function LeaderboardRow({ game, rank, profile }: { game: GameRecord; rank: number; profile: UserProfile | undefined; }) {
  return (
    <tr>
      <td className="px-2 text-center">{rank}</td>
      <td className="px-2 text-center">{profile ? profile.displayName ?? profile.username : 'Loading...'}</td>
      <td className="px-2 text-center">{(game.milliseconds / 1000).toFixed(2)}</td>
      <td className="px-2 text-center">{game.sourceName}</td>
      <td className="px-2 text-center">{game.targetName}</td>
      <td className="px-2 text-center">{game.difficulty}</td>
      <td className="px-2 text-center">{game.hintsUsed}</td>
    </tr>
  );
}
