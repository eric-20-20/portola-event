export default function MapPage() {
  return (
    <div>
      <h1>Venue Map</h1>
      <p>Tap to open full size.</p>

      {/* Clickable preview that opens the full image in a new tab */}
      <a href="/venue-map.jpeg" target="_blank" rel="noreferrer">
        <img
          src="/venue-map.jpeg"
          alt="Venue Map"
          style={{ width: "100%", height: "auto", border: "1px solid #eee", borderRadius: 8 }}
        />
      </a>
    </div>
  );
}