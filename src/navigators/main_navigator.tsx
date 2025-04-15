import React from "react";
// Navigation Imports
import { createStackNavigator } from "@react-navigation/stack";
import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import { SignedIn } from "@clerk/clerk-expo";
// Icon Libraries
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
// Utilities
import { t } from "~/utility/utility";

// Importing Necessary Screens Required for Navigation
import { HomeScreen } from "~/screens/homes/HomeScreen";
import { SearchScreen } from "~/screens/search/index";
import BarcodeScreen from "~/screens/food/Barcode";
import { SavedScreen } from "~/screens/homes/SavedScreen";
// Other Screens where Navigation may be Required
import FoodDetails from "~/screens/food/FoodDetails";
import FoodsScreen from "~/screens/food/FoodsScreen";
import DrugsScreen from "~/screens/drug/DrugsScreen";
import ProfileScreen from "~/screens/homes/ProfileScreen";
import DrugDetails from "~/screens/drug/DrugDetails";
import EditProfileScreen from "~/screens/homes/EditProfileScreen";
import ReportIncidentScreen from "~/screens/report/ReportIncidentScreen";
import { ReportFormState, ReviewSubmitRouteParams } from "./types";
import MedicalHistoryScreen from "~/screens/report/MedicalHistoryScreen";
import ReviewSubmitScreen from "~/screens/report/ReviewSubmitScreen";

// Defining Route Type for Stack Navigator
export type MainStackParamList = {
  Home: undefined;
  ProfileScreen: undefined;
  EditProfileScreen: undefined;
  Barcode: undefined;
  History: undefined;
  FoodDetails: { Pinfo: any; recallData: any };
  DrugDetails: { Pinfo: any; recallData: any };
  ReportIncident: undefined;
  MedicalHistory: { reportData: ReportFormState };
  ReviewSubmit: ReviewSubmitRouteParams;
};

// Defining Routes for Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Barcode: undefined;
  History: undefined;
  Report: undefined;
};

// Creating Navigators
const Stack = createStackNavigator<MainStackParamList>();
const Tab = createMaterialBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigation resembling Figma UI
function MainStack() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      labeled={true} // ensures both icons and labels are always shown (alternative to shifted)
      backBehavior="initialRoute"
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={FoodsScreen}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="search" color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Barcode"
        component={BarcodeScreen}
        options={{
          tabBarLabel: "Scan",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="barcode" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={SavedScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="history" color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportIncidentScreen}
        options={{
          tabBarLabel: "Report",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="notebook-edit-outline"
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator that wraps the bottom tabs and routes
function MainNavigator() {
  return (
    <SignedIn>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerTitleAlign: "center" }}
      >
        <Stack.Screen
          name="Home"
          component={MainStack}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ title: t("Profile_title") }}
        />
        <Stack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen}
          options={{ title: "Edit Profile" }}
        />
        <Stack.Screen name="Barcode" component={BarcodeScreen} />
        <Stack.Screen name="History" component={SavedScreen} />
        <Stack.Screen
          name="ReportIncident"
          component={ReportIncidentScreen}
          options={{ title: t("Report Incident") }}
        />
        <Stack.Screen
          name="MedicalHistory"
          component={MedicalHistoryScreen}
          options={{ title: t("Medical History") }}
        />
        <Stack.Screen
          name="ReviewSubmit"
          component={ReviewSubmitScreen}
          options={{ title: t("Review & Submit") }}
        />

        {/* Standalone Screens */}
        <Stack.Screen
          name="FoodDetails"
          component={FoodDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DrugDetails"
          component={DrugDetails}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SignedIn>
  );
}

export default MainNavigator;
