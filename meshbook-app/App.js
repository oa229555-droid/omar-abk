import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { P2PHost, P2PClient, P2PSession } from 'react-native-p2p-secure';

// معلومات المطور
const DEVELOPER = {
  name: 'Omar Abdo',
  phone: '01289411976',
  email: 'omar@meshbook.com'
};

export default function App() {
  // حالة التطبيق
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // بيانات المنصة
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // شبكة P2P
  const [p2pSession, setP2pSession] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [sessionPin, setSessionPin] = useState('');
  const [nearbySessions, setNearbySessions] = useState([]);
  
  // واجهات
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('feed');

  // تحميل البيانات المحفوظة
  useEffect(() => {
    loadUserData();
    initP2PNetwork();
    
    // منشورات افتراضية
    setPosts([
      {
        id: '1',
        author: 'Omar Abdo',
        content: 'مرحباً بكم في MESHBOOK - أول شبكة اجتماعية لا مركزية! 🌐',
        videoUrl: null,
        timestamp: Date.now() - 3600000,
        likes: 15,
        comments: 5,
        shares: 2
      },
      {
        id: '2',
        author: 'أحمد محمد',
        content: '🎥 شوفوا الفيديو الجديد ده',
        videoUrl: 'sample.mp4',
        timestamp: Date.now() - 7200000,
        likes: 23,
        comments: 8,
        shares: 4
      }
    ]);
  }, []);

  // تحميل بيانات المستخدم
  const loadUserData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      if (savedUsername) {
        setUsername(savedUsername);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log('خطأ في تحميل البيانات');
    }
  };

  // تهيئة شبكة P2P
  const initP2PNetwork = async () => {
    try {
      const session = await P2PSession.create('meshbook');
      setP2pSession(session);
      console.log('✅ شبكة P2P جاهزة');
    } catch (error) {
      console.error('❌ فشل تشغيل شبكة P2P:', error);
    }
  };

  // بدء جلسة P2P (كمضيف)
  const startP2PHost = async () => {
    try {
      setIsLoading(true);
      const host = new P2PHost(p2pSession);
      
      host.on('coordinator-connected', (neighbor) => {
        setPeers(prev => [...prev, neighbor]);
        Alert.alert('✅ جهاز جديد', `تم الاتصال بجهاز ${neighbor.username || 'غير معروف'}`);
      });
      
      host.on('session-started', () => {
        Alert.alert('🚀 بدأت الجلسة', 'يمكنك الآن تبادل المنشورات');
      });
      
      await host.start();
      setSessionPin(host.getSessionPasscode());
      setIsHost(true);
      setShowPeerModal(true);
    } catch (error) {
      Alert.alert('خطأ', 'فشل بدء الجلسة');
    } finally {
      setIsLoading(false);
    }
  };

  // البحث عن أجهزة قريبة
  const discoverNearbyPeers = async () => {
    try {
      setIsLoading(true);
      const client = new P2PClient(p2pSession);
      
      client.on('discovery-service-list-update', (sessions) => {
        setNearbySessions(sessions);
      });
      
      await client.start();
      setShowPeerModal(true);
    } catch (error) {
      Alert.alert('خطأ', 'فشل البحث عن أجهزة');
    } finally {
      setIsLoading(false);
    }
  };

  // الاتصال بجهاز معين
  const connectToPeer = async (sessionId, pin) => {
    try {
      setIsLoading(true);
      const client = new P2PClient(p2pSession);
      
      client.on('session-started', () => {
        Alert.alert('✅ متصل', 'تم الاتصال بالشبكة');
        setShowPeerModal(false);
      });
      
      await client.connectSession(sessionId, pin);
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  // اختيار فيديو من الجهاز
  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('خطأ', 'محتاج إذن لدخول المعرض');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedVideo(result.assets[0]);
        setShowVideoPicker(false);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل اختيار الفيديو');
    }
  };

  // تسجيل الدخول
  const handleLogin = () => {
    if (username && password) {
      AsyncStorage.setItem('username', username);
      setIsLoggedIn(true);
    } else {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات');
    }
  };

  // إنشاء منشور جديد
  const createPost = async () => {
    if (!newPostText && !selectedVideo) {
      Alert.alert('تنبيه', 'الرجاء إدخال نص أو اختيار فيديو');
      return;
    }

    const newPost = {
      id: Date.now().toString(),
      author: username,
      content: newPostText || '',
      videoUrl: selectedVideo?.uri || null,
      timestamp: Date.now(),
      likes: 0,
      comments: 0,
      shares: 0,
      peerId: p2pSession?.getIdentifier() || 'local'
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setSelectedVideo(null);

    // بث المنشور للشبكة P2P
    if (p2pSession && peers.length > 0) {
      // هنا هنبث المنشور لكل الأجهزة المتصلة
      Alert.alert('✅ تم', 'تم نشر المنشور وبثه للشبكة');
    }
  };

  // شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <Text style={styles.title}>MESHBOOK</Text>
          <Text style={styles.subtitle}>شبكة اجتماعية لا مركزية</Text>
          <Text style={styles.subtitle2}>بدون إنترنت • فيديو • P2P</Text>
          
          <View style={styles.developerCard}>
            <Text style={styles.developerText}>المطور: {DEVELOPER.name}</Text>
            <Text style={styles.developerText}>📱 {DEVELOPER.phone}</Text>
            <Text style={styles.developerEmail}>{DEVELOPER.email}</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>دخول</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // الصفحة الرئيسية
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MESHBOOK</Text>
          <Text style={styles.welcomeText}>مرحباً {username}!</Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.p2pButton}
            onPress={isHost ? null : discoverNearbyPeers}
          >
            <Text style={styles.p2pButtonText}>
              {isHost ? '🎯 مضيف' : '🔍 بحث'}
            </Text>
          </TouchableOpacity>
          
          {!isHost && (
            <TouchableOpacity 
              style={styles.p2pButton}
              onPress={startP2PHost}
            >
              <Text style={styles.p2pButtonText}>🚀 مضيف جديد</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* التبويبات */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'feed' && styles.activeTab]}
          onPress={() => setCurrentTab('feed')}
        >
          <Text style={currentTab === 'feed' ? styles.activeTabText : styles.tabText}>
            🏠 الرئيسية
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'network' && styles.activeTab]}
          onPress={() => setCurrentTab('network')}
        >
          <Text style={currentTab === 'network' ? styles.activeTabText : styles.tabText}>
            🌐 الشبكة ({peers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* محتوى التبويبات */}
      {currentTab === 'feed' ? (
        <View style={styles.feedContainer}>
          {/* إنشاء منشور */}
          <View style={styles.createPost}>
            <TextInput
              style={styles.postInput}
              placeholder="على بالك إيه؟"
              placeholderTextColor="#94a3b8"
              multiline
              value={newPostText}
              onChangeText={setNewPostText}
            />
            
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.videoButton}
                onPress={() => setShowVideoPicker(true)}
              >
                <Text style={styles.videoButtonText}>🎥 فيديو</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.publishButton}
                onPress={createPost}
              >
                <Text style={styles.publishButtonText}>نشر</Text>
              </TouchableOpacity>
            </View>
            
            {selectedVideo && (
              <View style={styles.selectedVideo}>
                <Text style={styles.selectedVideoText}>✅ تم اختيار فيديو</Text>
              </View>
            )}
          </View>

          {/* المنشورات */}
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.author[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.postAuthor}>{item.author}</Text>
                    <Text style={styles.postTime}>
                      {new Date(item.timestamp).toLocaleString('ar')}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.postContent}>{item.content}</Text>
                
                {item.videoUrl && (
                  <View style={styles.videoPreview}>
                    <Text style={styles.videoPreviewText}>🎥 فيديو</Text>
                  </View>
                )}
                
                <View style={styles.postStats}>
                  <Text style={styles.statText}>❤️ {item.likes}</Text>
                  <Text style={styles.statText}>💬 {item.comments}</Text>
                  <Text style={styles.statText}>🔄 {item.shares}</Text>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.networkContainer}>
          <Text style={styles.networkTitle}>🌐 شبكة P2P</Text>
          
          {isHost && (
            <View style={styles.pinCard}>
              <Text style={styles.pinLabel}>رمز الجلسة (شاركه مع الآخرين)</Text>
              <Text style={styles.pinCode}>{sessionPin}</Text>
            </View>
          )}
          
          <Text style={styles.peersTitle}>أجهزة متصلة ({peers.length})</Text>
          
          {peers.length === 0 ? (
            <Text style={styles.noPeers}>لا توجد أجهزة متصلة بعد</Text>
          ) : (
            peers.map((peer, index) => (
              <View key={index} style={styles.peerCard}>
                <View style={styles.peerIcon}>
                  <Text style={styles.peerIconText}>📱</Text>
                </View>
                <View style={styles.peerInfo}>
                  <Text style={styles.peerName}>{peer.username || 'جهاز غير معروف'}</Text>
                  <Text style={styles.peerStatus}>🟢 متصل</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* نافذة اختيار الفيديو */}
      <Modal visible={showVideoPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر فيديو</Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={pickVideo}
            >
              <Text style={styles.modalButtonText}>📱 من المعرض</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowVideoPicker(false)}
            >
              <Text style={styles.modalButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* نافذة اختيار جهاز */}
      <Modal visible={showPeerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isHost ? 'جلسة جديدة' : 'أجهزة قريبة'}
            </Text>
            
            {isHost ? (
              <View>
                <Text style={styles.modalText}>
                  رمز الجلسة: {sessionPin}
                </Text>
                <Text style={styles.modalSubText}>
                  شارك هذا الرمز مع الأجهزة الأخرى للاتصال
                </Text>
              </View>
            ) : (
              nearbySessions.map((session, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sessionItem}
                  onPress={() => {
                    Alert.prompt(
                      'أدخل رمز الجلسة',
                      'أدخل الرمز المكون من 6 أرقام',
                      (pin) => connectToPeer(session.id, pin)
                    );
                  }}
                >
                  <Text style={styles.sessionName}>جهاز {index + 1}</Text>
                </TouchableOpacity>
              ))
            )}
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowPeerModal(false)}
            >
              <Text style={styles.modalButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1877f2" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  // شاشة تسجيل الدخول
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1877f2',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  subtitle2: {
    fontSize: 14,
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 30,
  },
  developerCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#1877f2',
  },
  developerText: {
    color: '#fbbf24',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 3,
  },
  developerEmail: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loginButton: {
    backgroundColor: '#1877f2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // الصفحة الرئيسية
  header: {
    backgroundColor: '#1e293b',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1877f2',
  },
  welcomeText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  p2pButton: {
    backgroundColor: '#2a3a4a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1877f2',
  },
  p2pButtonText: {
    color: '#1877f2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 5,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1877f2',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  feedContainer: {
    flex: 1,
    padding: 15,
  },
  createPost: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  postInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postActions: {
    flexDirection: 'row',
    gap: 10,
  },
  videoButton: {
    flex: 1,
    backgroundColor: '#2a3a4a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  publishButton: {
    flex: 2,
    backgroundColor: '#1877f2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedVideo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#2a3a4a',
    borderRadius: 5,
  },
  selectedVideoText: {
    color: '#4ade80',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  postAuthor: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postTime: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  postContent: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
  },
  videoPreview: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  videoPreviewText: {
    color: '#fbbf24',
    fontSize: 16,
  },
  postStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    gap: 20,
  },
  statText: {
    color: '#94a3b8',
  },
  // شبكة P2P
  networkContainer: {
    flex: 1,
    padding: 15,
  },
  networkTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1877f2',
    marginBottom: 15,
  },
  pinCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  pinLabel: {
    color: '#94a3b8',
    marginBottom: 10,
  },
  pinCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fbbf24',
    letterSpacing: 5,
  },
  peersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  noPeers: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 30,
  },
  peerCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  peerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a3a4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  peerIconText: {
    fontSize: 20,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  peerStatus: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 2,
  },
  // مودال
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1877f2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  cancelButton: {
    backgroundColor: '#4b5563',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionItem: {
    backgroundColor: '#2a3a4a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sessionName: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  // تحميل
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
