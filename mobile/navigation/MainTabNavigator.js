import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlusCircle, User } from 'lucide-react-native';

import HomeScreen from '../screens/Main/HomeScreen';
import CreatePostScreen from '../screens/Main/CreatePostScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import PostDetailScreen from '../screens/Main/PostDetailScreen';
import NotificationsScreen from '../screens/Main/NotificationsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const HomeStackNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="HomeFeed" component={HomeScreen} />
        <HomeStack.Screen name="PostDetail" component={PostDetailScreen} />
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
        <HomeStack.Screen name="UserProfile" component={ProfileScreen} />
    </HomeStack.Navigator>
);

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#0f172a', // slate-900
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let IconComponent;
                    size = 24;

                    if (route.name === 'Home') {
                        IconComponent = Home;
                    } else if (route.name === 'CreatePost') {
                        IconComponent = PlusCircle;
                    } else if (route.name === 'Profile') {
                        IconComponent = User;
                    }

                    return <IconComponent size={size} color={focused ? '#818cf8' : '#64748b'} strokeWidth={focused ? 2.5 : 2} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStackNavigator} />
            <Tab.Screen name="CreatePost" component={CreatePostScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
