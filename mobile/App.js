import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <StatusBar style="light" />
                <AppNavigator />
            </SafeAreaProvider>
        </AuthProvider>
    );
}
