import { View, Text, StyleSheet } from 'react-native';

export default function SendScreen() {
  return (
    <View style={styles.container}>
      <Text>Envoi Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
