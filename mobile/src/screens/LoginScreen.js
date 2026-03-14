import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      // حفظ بيانات المستخدم
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userId', 'user_' + Date.now());
      
      navigation.replace('Feed');
    } catch (error) {
      Alert.alert('خطأ', 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/icon.png')} 
          style={styles.logo}
        />
        <Text style={styles.title}>MESHBOOK</Text>
        <Text style={styles.subtitle}>شبكة اجتماعية لا مركزية</Text>
        <Text style={styles.developer}>Omar Abdo | 01289411976</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            style={styles.input}
            placeholder="01xxxxxxxxx"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            ليس لديك حساب؟ سجل الآن
          </Text>
        </TouchableOpacity>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>رقم فودافون كاش للشحن:</Text>
          <Text style={styles.paymentNumber}>01069195481</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1877f2',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  developer: {
    fontSize: 12,
    color: '#fbbf24',
    marginTop: 10,
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loginButton: {
    backgroundColor: '#1877f2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#1877f2',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  paymentInfo: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  paymentTitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  paymentNumber: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default LoginScreen;
