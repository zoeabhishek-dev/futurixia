import { Link } from "react-router-dom"

const SOURCES = {
  dark: "/logo-dark.png",
  light: "/logo.png",
}

function Logo({ theme = "dark", height = 56, mobileHeight, to, style, className = "" }) {
  const image = (
    <img
      src={SOURCES[theme] || SOURCES.dark}
      alt="Futurixia"
      width={393}
      height={371}
      className={`fx-logo-img ${className}`.trim()}
      style={{
        "--fx-logo-h": `${height}px`,
        "--fx-logo-hm": `${mobileHeight || Math.round(height * 0.8)}px`,
        ...style,
      }}
      draggable={false}
      decoding="async"
    />
  )

  if (!to) return image

  return (
    <Link to={to} aria-label="Futurixia home" style={{ display: "inline-flex", lineHeight: 0 }}>
      {image}
    </Link>
  )
}

export default Logo