import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type PetLocationMapProps = {
  latitude: number;
  longitude: number;
  nomePet: string;
};

export default function PetLocationMap({
  latitude,
  longitude,
  nomePet,
}: PetLocationMapProps) {
  const html = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const nomeSeguro = JSON.stringify(nomePet).replace(/</g, "\\u003c");

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return "<html><body>Coordenadas inválidas.</body></html>";
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          .leaflet-control-attribution {
            font-size: 10px;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script>
          const latitude = ${lat};
          const longitude = ${lng};
          const nomePet = ${nomeSeguro};

          const map = L.map("map", {
            zoomControl: true,
            attributionControl: true
          }).setView([latitude, longitude], 16);

          L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          ).addTo(map);

          const marker = L.marker([latitude, longitude]).addTo(map);
          marker.bindPopup(nomePet).openPopup();
        </script>
      </body>
      </html>
    `;
  }, [latitude, longitude, nomePet]);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) =>
          request.url.startsWith("about:") || request.url.startsWith("https://")
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
  },
  map: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
});
