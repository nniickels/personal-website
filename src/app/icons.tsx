type IconName =
  | "anilist"
  | "email"
  | "github"
  | "instagram"
  | "linkedin"
  | "maps"
  | "pinterest"
  | "spotify";

export type SocialLink = {
  name: string;
  href: string;
  icon: IconName;
};

function SocialIcon({ name }: { name: IconName }) {
  if (name === "anilist") {
    return (
      <svg viewBox="-3 -3 30 30" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          stroke="none"
          d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"
        />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          stroke="none"
          d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.41-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.98 10.98 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.15v3.26c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"
        />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="6.7" cy="7" r="1.3" fill="currentColor" stroke="none" />
        <path
          d="M5.5 10.2h2.4v7.3H5.5zM10.5 10.2h2.3v1c.7-.9 1.6-1.3 2.8-1.3 2.1 0 3.4 1.3 3.4 4v3.6h-2.4v-3.3c0-1.4-.5-2.1-1.7-2.1-1.3 0-2 1-2 2.5v2.9h-2.4v-7.3Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    );
  }

  if (name === "maps") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.1" />
      </svg>
    );
  }

  if (name === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          stroke="none"
          d="M12 2.5a9.5 9.5 0 0 0-3.46 18.35c-.08-1.56-.02-3.43.39-5.18l1.22-5.17s-.31-.62-.31-1.54c0-1.44.84-2.52 1.88-2.52.89 0 1.32.67 1.32 1.47 0 .9-.57 2.23-.86 3.47-.24 1.04.52 1.89 1.55 1.89 1.86 0 3.29-1.96 3.29-4.8 0-2.51-1.8-4.26-4.38-4.26-2.98 0-4.73 2.24-4.73 4.55 0 .9.35 1.87.78 2.39.09.1.1.18.07.3l-.29 1.18c-.05.19-.15.23-.35.14-1.31-.61-2.13-2.52-2.13-4.06 0-3.31 2.4-6.34 6.93-6.34 3.64 0 6.47 2.59 6.47 6.05 0 3.62-2.28 6.53-5.44 6.53-1.06 0-2.06-.55-2.4-1.2l-.65 2.49c-.24.91-.88 2.05-1.31 2.75.99.31 2.03.48 3.11.48A9.5 9.5 0 0 0 12 2.5Z"
        />
      </svg>
    );
  }

  if (name === "spotify") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="M7.7 9.1c3.2-1 7.2-.7 9.8.8M8.4 12.3c2.7-.8 5.9-.5 8.2.7M9 15.2c2.2-.6 4.6-.3 6.5.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ExternalLinkIcon() {
  return (
    <>
      {"\u2060"}
      <svg
        className="external-link-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    </>
  );
}

export function SocialLinks({ links }: { links: readonly SocialLink[] }) {
  return (
    <nav className="social-links" aria-label="External profiles">
      {links.map((link) => (
        <a
          className="social-link"
          href={link.href}
          key={link.name}
          target={link.icon === "email" ? undefined : "_blank"}
          rel={link.icon === "email" ? undefined : "noreferrer"}
          aria-label={link.name}
          title={link.name}
        >
          <SocialIcon name={link.icon} />
        </a>
      ))}
    </nav>
  );
}
