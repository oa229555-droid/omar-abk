import { PermissionsAndroid, Platform } from 'react-native';
import WifiP2p from 'react-native-wifi-p2p';
import BleManager from 'react-native-ble-manager';

let peers = [];
let messageListeners = [];

// طلب الأذونات
export const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      ]);

      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

// بدء شبكة P2P
export const initP2P = async () => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('الأذونات مرفوضة');
      return [];
    }

    // بدء Wi-Fi P2P
    await WifiP2p.initialize();
    
    // بدء Bluetooth
    await BleManager.start({ showAlert: false });

    // البحث عن الأجهزة القريبة
    await WifiP2p.discoverPeers();

    WifiP2p.on('peersAvailable', (event) => {
      peers = event.peers || [];
      console.log('أجهزة قريبة:', peers.length);
    });

    // استماع للرسائل الواردة
    WifiP2p.on('messageReceived', (message) => {
      messageListeners.forEach(listener => listener(message));
    });

    return peers;
  } catch (error) {
    console.error('فشل بدء شبكة P2P:', error);
    return [];
  }
};

// إضافة مستمع للرسائل
export const addMessageListener = (callback) => {
  messageListeners.push(callback);
  return () => {
    messageListeners = messageListeners.filter(cb => cb !== callback);
  };
};

// بث منشور لجميع الأجهزة القريبة
export const broadcastPost = async (post) => {
  try {
    const message = JSON.stringify({
      type: 'post',
      data: post,
      timestamp: Date.now(),
    });

    // إرسال عبر Wi-Fi Direct
    for (const peer of peers) {
      try {
        await WifiP2p.sendMessage(peer.deviceAddress, message);
      } catch (e) {
        console.log('فشل إرسال Wi-Fi لجهاز:', peer.deviceAddress);
      }
    }

    // إرسال عبر Bluetooth
    const connectedDevices = await BleManager.getConnectedPeripherals([]);
    for (const device of connectedDevices) {
      try {
        await BleManager.write(device.id, message);
      } catch (e) {
        console.log('فشل إرسال بلوتوث');
      }
    }

    return true;
  } catch (error) {
    console.error('فشل بث المنشور:', error);
    return false;
  }
};

// اكتشاف الأجهزة القريبة
export const discoverPeers = async () => {
  try {
    await WifiP2p.discoverPeers();
    return peers;
  } catch (error) {
    console.error('فشل اكتشاف الأجهزة:', error);
    return [];
  }
};

// الاتصال بجهاز معين
export const connectToPeer = async (deviceAddress) => {
  try {
    await WifiP2p.connect(deviceAddress);
    return true;
  } catch (error) {
    console.error('فشل الاتصال:', error);
    return false;
  }
};

// إرسال رسالة مباشرة لجهاز
export const sendToPeer = async (deviceAddress, message) => {
  try {
    await WifiP2p.sendMessage(deviceAddress, JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('فشل إرسال الرسالة:', error);
    return false;
  }
};
