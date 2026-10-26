import { TrueSheetOverlay, TrueSheetProvider } from '@lodev09/react-native-true-sheet';
import { Sheet } from '@lodev09/react-native-true-sheet/navigation/expo-router';
import { Text } from 'react-native';

// Opening /details from its URL renders the home page with the Details sheet presented on it.
export const unstable_settings = { anchor: 'index' };

export default function RootLayout() {
  return (
    <TrueSheetProvider>
      <Sheet>
        <Sheet.Screen name="index" />
        <Sheet.Screen name="details" options={{ detents: [0.5] }} />
      </Sheet>
      <TrueSheetOverlay>
        <Text testID="overlay" style={{ position: 'absolute', top: 8, right: 8 }}>
          Overlay
        </Text>
      </TrueSheetOverlay>
    </TrueSheetProvider>
  );
}
