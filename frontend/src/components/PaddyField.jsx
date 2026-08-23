const stalks = Array.from({ length: 42 }, (_, index) => ({
  left: `${(index * 37) % 102}%`,
  height: `${48 + ((index * 29) % 52)}px`,
  delay: `${-((index * 13) % 38) / 10}s`,
  duration: `${3.8 + ((index * 7) % 18) / 10}s`,
  opacity: 0.5 + ((index * 11) % 45) / 100,
}))

const plots = Array.from({ length: 10 }, (_, index) => index)

export default function PaddyField() {
  return (
    <div className="paddy-scene" aria-hidden="true">
      <div className="paddy-cloud paddy-cloud-one" />
      <div className="paddy-cloud paddy-cloud-two" />
      <div className="paddy-cloud paddy-cloud-three" />
      <div className="paddy-mountain paddy-mountain-back" />
      <div className="paddy-mountain paddy-mountain-mid" />
      <div className="paddy-mountain paddy-mountain-front" />
      <div className="paddy-tree-line" />
      <div className="paddy-plots">
        {plots.map((plot) => <span key={plot} className={`paddy-plot paddy-plot-${plot + 1}`} />)}
      </div>
      <div className="paddy-grove" />
      <div className="paddy-farmhouse"><i /></div>
      <div className="paddy-path" />
      <div className="paddy-stalks">
        {stalks.map((stalk, index) => (
          <span
            key={index}
            className={`paddy-stalk paddy-stalk-${index % 3}`}
            style={{
              left: stalk.left,
              height: stalk.height,
              animationDelay: stalk.delay,
              animationDuration: stalk.duration,
              opacity: stalk.opacity,
            }}
          >
            <i />
          </span>
        ))}
      </div>
      <div className="paddy-foreground" />
    </div>
  )
}
