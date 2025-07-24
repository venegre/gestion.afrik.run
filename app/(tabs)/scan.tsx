import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Camera as FlipCamera } from 'lucide-react-native';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert('Code scanné', data, [
      { text: 'Scanner à nouveau', onPress: () => setScanned(false) }
    ]);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Demande d'accès à la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>Pas d'accès à la caméra</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.buttonText}>Autoriser l'accès</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          >
            <FlipCamera color="white" size={24} />
          </TouchableOpacity>
          <View style={styles.scanArea} />
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '80%',
    height: '30%',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
