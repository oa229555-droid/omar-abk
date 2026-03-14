import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPosts, savePost } from '../services/database';
import { initP2P, broadcastPost, discoverPeers } from '../services/p2p';

const FeedScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [peersCount, setPeersCount] = useState(0);
  const [balance, setBalance] = useState(100);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
    loadPosts();
    setupNetwork();
  }, []);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('userName') || 'مستخدم';
    const bal = await AsyncStorage.getItem('userBalance') || '100';
    setUserName(name);
    setBalance(parseInt(bal));
  };

  const loadPosts = async () => {
    const savedPosts = await getPosts();
    setPosts(savedPosts);
  };

  const setupNetwork = async () => {
    const peers = await initP2P();
    setPeersCount(peers.length);

    setInterval(async () => {
      const nearby = await discoverPeers();
      setPeersCount(nearby.length);
    }, 30000);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    const post = {
      id: Date.now().toString(),
      content: newPost,
      author: userName,
      authorId: await AsyncStorage.getItem('userId'),
      timestamp: Date.now(),
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
    };

    await savePost(post);
    setPosts([post, ...posts]);
    await broadcastPost(post);
    setNewPost('');
  };

  const handleLike = async (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId && !post.liked) {
        post.likes += 1;
        post.liked = true;
        
        // زيادة الرصيد (0.1 MESHCoin لكل إعجاب)
        const newBalance = balance + 0.1;
        setBalance(newBalance);
        AsyncStorage.setItem('userBalance', newBalance.toString());
      }
      return post;
    });
    
    setPosts(updatedPosts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
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

      <View style={styles.postStats}>
        <Text style={styles.statText}>❤️ {item.likes}</Text>
        <Text style={styles.statText}>💬 {item.comments}</Text>
        <Text style={styles.statText}>🔄 {item.shares}</Text>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Icon 
            name={item.liked ? 'heart' : 'heart-o'} 
            size={20} 
            color={item.liked ? '#ff4444' : '#94a3b8'} 
          />
          <Text style={styles.actionText}>إعجاب</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="comment-o" size={20} color="#94a3b8" />
          <Text style={styles.actionText}>تعليق</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share" size={20} color="#94a3b8" />
          <Text style={styles.actionText}>مشاركة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MESHBOOK</Text>
          <Text style={styles.welcomeText}>مرحباً {userName}!</Text>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.peersBadge}>
            <Icon name="wifi" size={14} color="#4ade80" />
            <Text style={styles.peersText}>{peersCount}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.balanceBadge}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Icon name="bitcoin" size={14} color="#fbbf24" />
            <Text style={styles.balanceText}>{balance}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* صندوق إنشاء منشور */}
      <View style={styles.createPost}>
        <TextInput
          style={styles.postInput}
          placeholder="على بالك إيه؟"
          placeholderTextColor="#64748b"
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <TouchableOpacity 
          style={styles.postButton}
          onPress={handleCreatePost}
        >
          <Text style={styles.postButtonText}>نشر</Text>
        </TouchableOpacity>
      </View>

      {/* المنشورات */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feedList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="frown-o" size={50} color="#334155" />
            <Text style={styles.emptyText}>لا توجد منشورات بعد</Text>
            <Text style={styles.emptySubText}>أول منشور يبدأ منك!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e293b',
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
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3a4a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  peersText: {
    color: '#4ade80',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3a4a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  balanceText: {
    color: '#fbbf24',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  createPost: {
    padding: 15,
    backgroundColor: '#1e293b',
    marginBottom: 10,
  },
  postInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postButton: {
    backgroundColor: '#1877f2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  feedList: {
    padding: 10,
  },
  postCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
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
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  actionText: {
    color: '#94a3b8',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 18,
    marginTop: 20,
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 10,
  },
});

export default FeedScreen;
