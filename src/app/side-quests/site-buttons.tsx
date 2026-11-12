import { siteButtons } from "./data";

export default function SiteButtons() {
  return (
    <section className="section" id="buttons">
      <h2>Buttons</h2>
      <p className="site-buttons-description">Cool people and sites and stuff~</p>
      {siteButtons.length ? (
        <div className="site-button-wall">
          {siteButtons.map((site, index) => (
            <a key={site.href} href={site.href} target="_blank" rel="noopener noreferrer" aria-label={site.name} aria-describedby={"site-button-url-" + index}>
              <img src={site.image} alt={site.name} width={88} height={31} loading="lazy" />
              <span className="site-button-url" role="tooltip" id={"site-button-url-" + index}>{site.href}</span>
            </a>
          ))}
        </div>
      ) : <p className="placeholder-copy">A place for buttons from sites I like. Coming soon.</p>}
    </section>
  );
}
