import { useEffect, useRef, useState } from "react";
import "./DeliveryMap.css";

const ORIGIN = [10.7437859, 106.6740334];
let mapLibrePromise;
function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (!mapLibrePromise)
    mapLibrePromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css";
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js";
      script.onload = () => resolve(window.maplibregl);
      script.onerror = () => {
        mapLibrePromise = null;
        reject(new Error("Không tải được bản đồ. Vui lòng tải lại trang."));
      };
      document.head.appendChild(script);
    });
  return mapLibrePromise;
}

export function DeliveryMap({ point, onChange, address }) {
  const container = useRef(null);
  const instance = useRef(null);
  const callback = useRef(onChange);
  const latestPoint = useRef(point);
  const [error, setError] = useState("");
  const query = address;
  const latestAddress = useRef(address);
  latestAddress.current = address;
  useEffect(() => {
    setResults([]);
    setMessage("");
  }, [address]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  callback.current = onChange;
  latestPoint.current = point;
  useEffect(() => {
    let active = true;
    let map;
    loadMapLibre()
      .then((L) => {
        if (!active) return;
        map = new L.Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [ORIGIN[1], ORIGIN[0]],
          zoom: 13,
        });
        map.addControl(new L.NavigationControl());
        new L.Marker({ color: "#16634b" })
          .setLngLat([ORIGIN[1], ORIGIN[0]])
          .setPopup(new L.Popup().setText("Kho LUMIQ · 801/2 Phạm Thế Hiển"))
          .addTo(map);
        map.on(
          "error",
          () =>
            active &&
            setError(
              "Không tải được một phần bản đồ. Kiểm tra mạng và tải lại trang.",
            ),
        );
        map.on("load", () => {
          if (active) {
            map.resize();
            setError("");
          }
        });
        const marker = new L.Marker({ draggable: true, color: "#df5738" });
        const select = (p) =>
          callback.current({ latitude: p.lat, longitude: p.lng });
        marker.on("dragend", () => select(marker.getLngLat()));
        map.on("click", (event) => select(event.lngLat));
        instance.current = { map, marker };
        if (latestPoint.current)
          marker
            .setLngLat([
              latestPoint.current.longitude,
              latestPoint.current.latitude,
            ])
            .addTo(map);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
      instance.current = null;
      map?.remove();
    };
  }, []);
  useEffect(() => {
    if (point && instance.current) {
      instance.current.marker
        .setLngLat([point.longitude, point.latitude])
        .addTo(instance.current.map);
    } else if (instance.current) {
      instance.current.marker.remove();
    }
  }, [point]);
  function locate() {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        callback.current(next);
        instance.current?.map.flyTo({
          center: [next.longitude, next.latitude],
          zoom: 16,
        });
        setError("");
      },
      () => setError("Không lấy được vị trí. Hãy bấm trên bản đồ để chọn."),
      { timeout: 10000 },
    );
  }
  async function search() {
    if (query.trim().length < 3 || searching) return;
    setSearching(true);
    setResults([]);
    setMessage("");
    const searchedAddress = query;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        lat: String(ORIGIN[0]),
        lon: String(ORIGIN[1]),
        limit: "8",
        bbox: "106.2,10.3,107.1,11.2",
      });
      const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          "Dịch vụ tìm địa chỉ đang bận. Bạn có thể ghim trực tiếp trên bản đồ.",
        );
      const data = await response.json();
      if (latestAddress.current !== searchedAddress) return;
      const found = (data.features || []).filter(
        (f) =>
          f.geometry?.type === "Point" &&
          f.geometry.coordinates.every(Number.isFinite),
      );
      setResults(found);
      if (!found.length)
        setMessage(
          "Không tìm thấy. Thử tên đường và phường, rồi kéo ghim đến đúng số nhà.",
        );
    } catch (e) {
      setMessage(
        e.name === "AbortError"
          ? "Tìm kiếm quá lâu. Vui lòng thử lại."
          : e.message,
      );
    } finally {
      clearTimeout(timer);
      setSearching(false);
    }
  }
  return (
    <section className="delivery-picker" aria-label="Chọn vị trí giao hàng">
      <div className="delivery-heading">
        <strong>Xác nhận trên bản đồ</strong>
        <span>Trong phạm vi 40 km</span>
      </div>
      <p className="delivery-hint">
        Tìm địa chỉ đã nhập ở trên, rồi chỉnh ghim đúng lối vào nhà để tính phí
        giao hàng.
      </p>
      <div className="delivery-search">
        <button
          type="button"
          className="button secondary"
          disabled={searching || query.trim().length < 3}
          onClick={search}
        >
          {searching ? "Đang tìm…" : "Tìm địa chỉ này trên bản đồ"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {results.length > 0 && (
        <ul
          style={{
            padding: 0,
            listStyle: "none",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {results.map((f, i) => {
            const p = f.properties || {};
            const label = [
              ...new Set(
                [p.name, p.housenumber, p.street, p.district, p.city].filter(
                  Boolean,
                ),
              ),
            ].join(", ");
            return (
              <li key={i}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: "100%", textAlign: "left", marginBottom: 6 }}
                  onClick={() => {
                    const [longitude, latitude] = f.geometry.coordinates;
                    onChange({ latitude, longitude });
                    instance.current?.map.flyTo({
                      center: [longitude, latitude],
                      zoom: 16,
                    });
                    setResults([]);
                    setMessage(
                      "Đã chọn. Kiểm tra và kéo ghim đến đúng lối vào nhà.",
                    );
                  }}
                >
                  {label || "Chọn vị trí"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div
        ref={container}
        style={{
          height: 340,
          borderRadius: 12,
          border: "1px solid #ddd",
          position: "relative",
          zIndex: 0,
        }}
      />
      <div className="delivery-footer">
        <span className={point ? "delivery-selected" : "delivery-hint"}>
          {point ? "✓ Đã chọn điểm giao hàng" : "Chọn một điểm trên bản đồ"}
        </span>
        <button type="button" className="button secondary" onClick={locate}>
          Vị trí của tôi
        </button>
      </div>
      <small className="delivery-legend">
        <span>● Kho LUMIQ</span>
        <span>● Điểm nhận hàng</span>
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
