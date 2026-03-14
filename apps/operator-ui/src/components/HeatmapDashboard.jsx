import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DistrictAnalyticsPanel from "./DistrictAnalyticsPanel";
import { api } from "../services/api";
import { getMockRejectionData } from "../data/rejectionData";

const RANGE_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" }
];

function normalizeDistrictName(name) {
  return String(name || "").trim().toLowerCase();
}

function rejectionColor(totalRejected) {
  if (totalRejected <= 5) return "#22c55e";
  if (totalRejected <= 15) return "#facc15";
  if (totalRejected <= 30) return "#fb923c";
  return "#ef4444";
}

function FitCgBounds({ mapBounds }) {
  const map = useMap();

  useEffect(() => {
    if (!mapBounds) return;
    map.fitBounds(mapBounds, { padding: [16, 16] });
  }, [map, mapBounds]);

  return null;
}

export default function HeatmapDashboard() {
  const [range, setRange] = useState("this_month");
  const [geoData, setGeoData] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [analytics, setAnalytics] = useState(getMockRejectionData("this_month"));
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/data/chhattisgarh-districts.geojson")
      .then((response) => response.json())
      .then((geojson) => {
        if (!mounted) return;
        setGeoData(geojson);

        const bounds = L.geoJSON(geojson).getBounds();
        if (bounds && bounds.isValid()) {
          // Slight padding so users can wander around but remain inside state context.
          setMapBounds(bounds.pad(0.25));
        }
      })
      .catch((error) => {
        console.error("Failed to load district GeoJSON", error);
        if (!mounted) return;
        setGeoData({ type: "FeatureCollection", features: [] });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .getRejectionAnalytics(range)
      .then((data) => {
        if (!mounted) return;
        const safeData = data && Array.isArray(data.districts) ? data : getMockRejectionData(range);
        setAnalytics(safeData);

        setSelectedDistrict((previous) => {
          const currentSelection = previous?.name;
          if (!currentSelection) return previous;

          const refreshed = (safeData.districts || []).find(
            (district) => normalizeDistrictName(district.name) === normalizeDistrictName(currentSelection)
          );

          return refreshed || previous;
        });
      })
      .catch((error) => {
        console.error("Heatmap analytics fallback to mock data", error);
        if (!mounted) return;
        setAnalytics(getMockRejectionData(range));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [range]);

  const districtLookup = useMemo(() => {
    const map = new Map();
    (analytics.districts || []).forEach((district) => {
      map.set(normalizeDistrictName(district.name), district);
    });
    return map;
  }, [analytics]);

  const getDistrictStats = useCallback(
    (feature) => {
      const districtName = feature?.properties?.name || feature?.properties?.district || "";
      return districtLookup.get(normalizeDistrictName(districtName)) || {
        name: districtName,
        totalApplications: 0,
        totalRejected: 0,
        services: []
      };
    },
    [districtLookup]
  );

  const geoStyle = useCallback(
    (feature) => {
      const stats = getDistrictStats(feature);
      return {
        fillColor: rejectionColor(Number(stats.totalRejected || 0)),
        weight: 1,
        color: "#1f2937",
        fillOpacity: 0.6
      };
    },
    [getDistrictStats]
  );

  const onEachDistrict = useCallback(
    (feature, layer) => {
      const stats = getDistrictStats(feature);
      const totalApplications = Number(stats.totalApplications || 0);
      const totalRejected = Number(stats.totalRejected || 0);
      const rejectionRate = totalApplications > 0 ? Math.round((totalRejected / totalApplications) * 100) : 0;
      const districtName = stats.name || feature?.properties?.name || "Unknown District";

      layer.bindTooltip(
        `<div style="min-width:180px"><strong>${districtName}</strong><br/>Applications: ${totalApplications}<br/>Rejected: ${totalRejected}<br/>Rejection Rate: ${rejectionRate}%</div>`,
        { sticky: true }
      );

      layer.on({
        mouseover: () => {
          layer.setStyle({ weight: 2, fillOpacity: 0.8 });
        },
        mouseout: () => {
          layer.setStyle({ weight: 1, fillOpacity: 0.6 });
        },
        click: () => {
          setSelectedDistrict(stats);
        }
      });
    },
    [getDistrictStats, geoStyle]
  );

  return (
    <section className="heatmap-dashboard card">
      <div className="heatmap-header">
        <div>
          <h2>Rejection Heatmap of Chhattisgarh</h2>
          <p>District-wise rejection intensity for operator monitoring</p>
        </div>
        <div className="heatmap-filter">
          <label htmlFor="heatmap-range">Time Range</label>
          <select
            id="heatmap-range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="heatmap-layout">
        <div className="heatmap-map-wrap">
          {!geoData ? (
            <div className="heatmap-loading">Loading district rejection heatmap...</div>
          ) : (
            <MapContainer
              center={[21.5, 82.0]}
              zoom={7}
              style={{ height: "250px", width: "100%", borderRadius: "14px" }}
              minZoom={6}
              maxZoom={11}
              maxBounds={mapBounds || undefined}
              maxBoundsViscosity={1.0}
              scrollWheelZoom
              dragging
              touchZoom
              doubleClickZoom
            >
              <FitCgBounds mapBounds={mapBounds} />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON data={geoData} style={geoStyle} onEachFeature={onEachDistrict} />
            </MapContainer>
          )}

          <div className="heatmap-legend">
            <h4>Legend</h4>
            <div><span style={{ background: "#22c55e" }} />Green -&gt; Low rejection</div>
            <div><span style={{ background: "#facc15" }} />Yellow -&gt; Moderate rejection</div>
            <div><span style={{ background: "#fb923c" }} />Orange -&gt; High rejection</div>
            <div><span style={{ background: "#ef4444" }} />Red -&gt; Critical rejection</div>
          </div>
        </div>

        <DistrictAnalyticsPanel district={selectedDistrict} />
      </div>
    </section>
  );
}
