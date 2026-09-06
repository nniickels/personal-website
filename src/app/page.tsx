type SteamGame = {
  title: string;
  playtimeLastTwoWeeks?: number;
};

const recentlyPlayedGames: SteamGame[] = [
  {
    title: "UNBEATABLE",
    playtimeLastTwoWeeks: 18,
  },
];

const hasFewerThanThreeRecentGames = recentlyPlayedGames.length < 3;

function getGameTitle(game: SteamGame) {
  return game.title;
}

export default function Home() {
  return (
    <main className="page-shell">
      <section className="profile">
        <p className="eyebrow">Personal Website</p>
        <h1>Nicole Jiang</h1>
        <p className="intro">
          Small digital home for projects, notes, and what I have been playing
          lately.
        </p>
      </section>

      <section className="steam" aria-labelledby="steam-heading">
        <div className="section-heading">
          <h2 id="steam-heading">Steam</h2>
          <span aria-hidden="true">+</span>
        </div>
        <p className="section-subheading">Recently Played</p>
        <ol className="game-list">
          {recentlyPlayedGames.map((game) => (
            <li key={game.title}>{getGameTitle(game)}</li>
          ))}
        </ol>
        {hasFewerThanThreeRecentGames ? (
          <p className="game-note">
            No other games played within the last 14 days
          </p>
        ) : null}
      </section>
    </main>
  );
}
