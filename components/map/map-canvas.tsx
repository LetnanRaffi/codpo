"use client";

import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  description?: string;
  color?: string;
  accuracyM?: number | null;
  stale?: boolean;
}

export interface MapCoordinate {
  lat: number;
  lng: number;
}

const DEFAULT_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function markerElement(point: MapPoint) {
  const element = document.createElement("button");
  element.type = "button";
  element.title = point.label;
  element.setAttribute("aria-label", point.label);
  element.style.width = "22px";
  element.style.height = "22px";
  element.style.borderRadius = "9999px";
  element.style.border = "3px solid white";
  element.style.background = point.stale ? "#9ca3af" : point.color ?? "#e4402a";
  element.style.boxShadow = "0 2px 8px rgba(0,0,0,.28)";
  return element;
}

export function MapCanvas({
  center,
  zoom = 13,
  markers = [],
  meetingPoint,
  onMeetingPointChange,
  className = "h-80 w-full",
}: {
  center: MapCoordinate;
  zoom?: number;
  markers?: MapPoint[];
  meetingPoint?: MapCoordinate | null;
  onMeetingPointChange?: (point: MapCoordinate) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const meetingMarkerRef = useRef<Marker | null>(null);
  const callbackRef = useRef(onMeetingPointChange);
  callbackRef.current = onMeetingPointChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE,
      center: [center.lng, center.lat],
      zoom,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    if (callbackRef.current) {
      map.on("click", (event) => {
        callbackRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });
    }
    mapRef.current = map;
    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      meetingMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      markerRefs.current = [];
      meetingMarkerRef.current = null;
    };
    // The map is initialized once; subsequent props update markers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((point) => {
      const marker = new maplibregl.Marker({ element: markerElement(point) })
        .setLngLat([point.lng, point.lat])
        .setPopup(new maplibregl.Popup({ offset: 14 }).setText(point.description ? `${point.label} — ${point.description}` : point.label))
        .addTo(map);
      return marker;
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !meetingPoint) {
      meetingMarkerRef.current?.remove();
      meetingMarkerRef.current = null;
      return;
    }
    meetingMarkerRef.current?.remove();
    const element = markerElement({ id: "meeting", ...meetingPoint, label: "Titik temu", color: "#1f7a5c" });
    const marker = new maplibregl.Marker({ element, draggable: Boolean(onMeetingPointChange) })
      .setLngLat([meetingPoint.lng, meetingPoint.lat])
      .setPopup(new maplibregl.Popup({ offset: 14 }).setText("Titik temu"))
      .addTo(map);
    if (onMeetingPointChange) {
      marker.on("dragend", () => {
        const location = marker.getLngLat();
        onMeetingPointChange({ lat: location.lat, lng: location.lng });
      });
    }
    meetingMarkerRef.current = marker;
  }, [meetingPoint, onMeetingPointChange]);

  return <div ref={containerRef} className={className} aria-label="Peta lokasi" role="application" />;
}
