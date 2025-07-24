import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './src/hooks/useAuth';
import LoginScreen from './src/screens/LoginScreen';
import SendScreen from './src/screens/SendScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import UsersScreen from './src/screens/UsersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@example.com';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Send':
              iconName = focused ? 'send' : 'send-outline';
              break;
            case 'Payment':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Users':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'alert';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Send" 
        component={SendScreen}
        options={{ title: 'Envoi' }}
      />
      <Tab.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ title: 'Paiement' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Historique' }}
      />
      {isAdmin && (
        <Tab.Screen 
          name="Users" 
          component={UsersScreen}
          options={{ title: 'Utilisateurs' }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
