import { PetsProvider } from "@/contexts/PetsContext";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const ACTIVE_COLOR = "#2E98FE";
const INACTIVE_COLOR = "#999999";

export default function TabLayout() {
  return (
    <PetsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,

          tabBarShowLabel: true,

          tabBarStyle: {
            position: "absolute",

            height: 95,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            elevation: 0,
            shadowColor: "transparent",
          },

          tabBarLabelStyle: {
            fontFamily: "Nunito_400Regular",
            fontSize: 10,
            marginTop: 4,
          },

          tabBarIconStyle: {
            marginTop: 10,
          },

          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Início",

            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="devices"
          options={{
            title: "Dispositivos",

            tabBarIcon: ({ color }) => (
              <MaterialIcons name="devices" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: "Relatórios",

            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bar-chart" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",

            tabBarIcon: ({ color }) => (
              <MaterialIcons name="pets" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </PetsProvider>
  );
}
