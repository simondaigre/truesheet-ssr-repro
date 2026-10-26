import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text>Home</Text>
      <Link href="/details">Open the details sheet</Link>
    </View>
  );
}
