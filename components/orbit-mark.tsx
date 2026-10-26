/** CSS illustration: no images, canvas loop or external assets. */
export function OrbitMark() {
  return <div className="orbit-art" aria-hidden="true">
    <div className="orbit-track orbit-track-one" />
    <div className="orbit-track orbit-track-two" />
    <div className="orbit-track orbit-track-three" />
    <div className="orbit-planet"><span /><span /><span /></div>
    <i className="orbit-satellite" />
    <span className="orbit-coordinate">FOCO / EQUILÍBRIO</span>
  </div>;
}
