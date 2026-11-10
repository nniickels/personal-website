const titleArtwork = {
  "nicole jiang": { src: "/title-art/nicole-jiang.webp", width: 1055, height: 322 },
  playground: { src: "/title-art/playground.webp", width: 1002, height: 322 },
} as const;

export function PageTitle({ title }: { title: keyof typeof titleArtwork }) {
  const { src, width, height } = titleArtwork[title];
  return (
    <h1 className="page-title">
      <span className="visually-hidden">{title}</span>
      <img src={src} alt="" width={width} height={height} fetchPriority="high" />
    </h1>
  );
}
