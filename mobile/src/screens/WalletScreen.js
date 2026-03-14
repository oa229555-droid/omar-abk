import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { createPaymentRequest, withdrawToVodafoneCash } from '../services/payment';
import { addTransaction } from '../services/database';

const WalletScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    const bal = await AsyncStorage.getItem('userBalance') || '0';
    setBalance(parseInt(bal));
    
    // تحميل المعاملات السابقة
    const savedTransactions = await AsyncStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseInt(amount) < 10) {
      Alert.alert('خطأ', 'الحد الأدنى للشحن 10 جنيه');
      return;
    }

    setLoading(true);
    try {
      const result = await createPaymentRequest('current-user', parseInt(amount));
      
      if (result.success) {
        Alert.alert(
          'تم إنشاء طلب الدفع',
          'بعد التحويل، سيتم إضافة الرصيد تلقائياً',
          [{ text: 'تم', onPress: () => setShowDeposit(false) }]
        );
      } else {
        Alert.alert('خطأ', 'فشل إنشاء طلب الدفع');
      }
    } catch (error) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !targetPhone) {
      Alert.alert('خطأ', 'الرجاء إدخال المبلغ ورقم الهاتف');
      return;
    }

    if (parseInt(amount) > balance) {
      Alert.alert('خطأ', 'الرصيد غير كاف');
      return;
    }

    setLoading(true);
    try {
      const result = await withdrawToVodafoneCash(
        'current-user',
        targetPhone,
        parseInt(amount)
      );

      if (result.success) {
        const newBalance = balance - parseInt(amount);
        setBalance(newBalance);
        await AsyncStorage.setItem('userBalance', newBalance.toString());
        
        const newTransaction = {
          id: Date.now(),
          amount: -parseInt(amount),
          type: 'withdraw',
          status: 'completed',
          date: new Date().toLocaleString(),
        };
        
        setTransactions([newTransaction, ...transactions]);
        await AsyncStorage.setItem('transactions', JSON.stringify([newTransaction, ...transactions]));
        
        Alert.alert('✅', result.message);
        setShowWithdraw(false);
        setAmount('');
        setTargetPhone('');
      }
    } catch (error) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const VodafoneCashQR = () => (
    <View style={styles.qrContainer}>
      <QRCode
        value={`vodafonecash://pay?phone=01069195481&amount=${amount || 10}`}
        size={200}
        color="#000"
        backgroundColor="#fff"
      />
      <Text style={styles.qrText}>امسح الكود للدفع عبر فودافون كاش</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* الرصيد */}
      <View style={styles.balanceCard}>
        <Icon name="bitcoin" size={40} color="#fbbf24" />
        <Text style={styles.balanceLabel}>رصيدك</Text>
        <Text style={styles.balanceAmount}>{balance} MESHCoin</Text>
        <Text style={styles.balanceEGP}>≈ {balance} جنيه</Text>
        
        <View style={styles.balanceActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setShowDeposit(true);
              setShowWithdraw(false);
            }}
          >
            <Icon name="arrow-down" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>شحن</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => {
              setShowWithdraw(true);
              setShowDeposit(false);
            }}
          >
            <Icon name="arrow-up" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>سحب</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* رقم فودافون كاش الرسمي */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>رقم فودافون كاش الرسمي</Text>
        <Text style={styles.infoNumber}>01069195481</Text>
        <Text style={styles.infoNote}>هذا هو الرقم الوحيد المعتمد للشحن</Text>
      </View>

      {/* نموذج الشحن */}
      {showDeposit && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>شحن الرصيد</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>المبلغ (جنيه)</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل المبلغ"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <VodafoneCashQR />

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleDeposit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>تأكيد الشحن</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* نموذج السحب */}
      {showWithdraw && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>سحب الأموال</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>رقم محفظة فودافون كاش</Text>
            <TextInput
              style={styles.input}
              placeholder="01xxxxxxxxx"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={targetPhone}
              onChangeText={setTargetPhone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل المبلغ"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, styles.withdrawSubmit]}
            onPress={handleWithdraw}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>تأكيد السحب</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* المعاملات السابقة */}
      <View style={styles.transactionsCard}>
        <Text style={styles.transactionsTitle}>آخر المعاملات</Text>
        
        {transactions.length === 0 ? (
          <Text style={styles.noTransactions}>لا توجد معاملات بعد</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.transactionItem}>
              <Icon 
                name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'} 
                size={16} 
                color={tx.amount > 0 ? '#4ade80' : '#ff4444'} 
              />
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {tx.amount > 0 ? 'شحن' : 'سحب'}
                </Text>
                <Text style={styles.transactionDate}>{tx.date}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: tx.amount > 0 ? '#4ade80' : '#ff4444' }
              ]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} MESHCoin
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.developerInfo}>
        <Text style={styles.developerText}>المطور: Omar Abdo</Text>
        <Text style={styles.phoneText}>01289411976</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    margin: 15,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 10,
  },
  balanceAmount: {
    color: '#fbbf24',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  balanceEGP: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 5,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  withdrawButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  infoTitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoNumber: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  infoNote: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },
  formCard: {
    backgroundColor: '#1e293b',
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 15,
  },
  qrText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#1877f2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  withdrawSubmit: {
    backgroundColor: '#ff4444',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionsCard: {
    backgroundColor: '#1e293b',
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  transactionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noTransactions: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  transactionType: {
    color: '#fff',
    fontWeight: 'bold',
  },
  transactionDate: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  developerInfo: {
    alignItems: 'center',
    padding: 20,
  },
  developerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  phoneText: {
    color: '#1877f2',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default WalletScreen;
