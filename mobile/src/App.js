import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestPermissions } from './services/p2p';
import { initDatabase } from './services/database';

// استيراد الشاشات
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import FeedScreen from './screens/FeedScreen';
import ProfileScreen from './screens/ProfileScreen';
import MessengerScreen from './screens/MessengerScreen';
import WalletScreen from './screens/WalletScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // طلب الأذونات
        await requestPermissions();
        
        // تهيئة قاعدة البيانات
        await initDatabase();
        
        setIsReady(true);
      } catch (error) {
        console.error('فشل تهيئة التطبيق:', error);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null; // أو شاشة تحميل
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'إنشاء حساب جديد' }}
          />
          <Stack.Screen 
            name="Feed" 
            component={FeedScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'الملف الشخصي' }}
          />
          <Stack.Screen 
            name="Messenger" 
            component={MessengerScreen} 
            options={{ title: 'المحادثات' }}
          />
          <Stack.Screen 
            name="Wallet" 
            component={WalletScreen} 
            options={{ title: 'محفظتي' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
    }
