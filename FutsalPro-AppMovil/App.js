import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import ReservasScreen from './src/screens/ReservasScreen';
import TorneosScreen from './src/screens/TorneosScreen';

const Tab = createBottomTabNavigator();

// Ícono personalizado para la pestaña Reservas
function ReservasTabIcon({ focused, color }) {
  return (
    <View style={styles.tabIconBox}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>📅</Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

// Ícono personalizado para la pestaña Torneos con badge de EN VIVO
function TorneosTabIcon({ focused, color }) {
  return (
    <View style={styles.tabIconBox}>
      <View style={styles.iconWithBadge}>
        <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>🏆</Text>
        <View style={styles.liveMiniBadge}>
          <Text style={styles.liveMiniText}>VIVO</Text>
        </View>
      </View>
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

function MainNavigation() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);
  const barHeight = 62 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Reservas"
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: barHeight,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{
          tabBarLabel: '📅 Canchas',
          tabBarIcon: ({ focused, color }) => (
            <ReservasTabIcon focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Torneos"
        component={TorneosScreen}
        options={{
          tabBarLabel: '🏆 Torneos y Fixture',
          tabBarIcon: ({ focused, color }) => (
            <TorneosTabIcon focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <MainNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopColor: '#334155',
    borderTopWidth: 1.5,
    paddingTop: 6,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabEmojiFocused: {
    transform: [{ scale: 1.15 }],
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMiniBadge: {
    position: 'absolute',
    top: -4,
    right: -16,
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  liveMiniText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeDot: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 3,
  },
});
