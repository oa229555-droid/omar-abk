import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!fullName || !phone || !password) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    try {
      // حفظ بيانات المستخدم
      await AsyncStorage.setItem('userName', fullName);
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userId', 'user_' + Date.now());
      await AsyncStorage.setItem('userBalance', '100'); // مكافأة ترحيبية
      
      Alert.alert('🎉', 'تم إنشاء الحساب بنجاح! حصلت على 100 MESHCoin هدية ترحيبية');
      navigation.replace('Feed');
    } catch (error) {
      Alert.alert('خطأ', 'فشل إنشاء الحساب');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: عمر عبدو"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>تأكيد كلمة المرور</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>إنشاء حساب</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.loginText}>
            لديك حساب بالفعل؟ سجل دخول
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  form: {
    padding: 30,
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
  registerButton: {
    backgroundColor: '#1877f2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#1877f2',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default RegisterScreen;
