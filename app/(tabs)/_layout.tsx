import { Tabs } from 'expo-router';
import { Send, CreditCard, History, Users, QrCode } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@example.com';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Envoi',
          tabBarIcon: ({ color, size }) => <Send size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: 'Paiement',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Utilisateurs',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
