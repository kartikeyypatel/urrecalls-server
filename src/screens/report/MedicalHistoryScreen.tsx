import React, { useState } from "react";
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
//import type { LoginNavigatorParamList } from "../../navigators/login_navigator"; // Use LoginNavigator's types
import type { MainStackParamList } from "../../navigators/main_navigator"; // Import from main_navigator
import type {
  ReportFormState,
  MedicalHistoryFormState,
  SelectedFileInfo,
} from "../../navigators/types"; // Import data structure types
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../../styles/colors"; // Path from src/screens to styles/

type MedicalHistoryNavigationProp = StackNavigationProp<
  MainStackParamList,
  "MedicalHistory"
>;
type MedicalHistoryRouteProp = RouteProp<
  MainStackParamList,
  "MedicalHistory"
>;

const MedicalHistoryScreen = () => {
  const navigation = useNavigation<MedicalHistoryNavigationProp>();
  const route = useRoute<MedicalHistoryRouteProp>();
  const reportData = route.params.reportData;

  const [medicalForm, setMedicalForm] = useState<
    Omit<MedicalHistoryFormState, "selectedReportInfo">
  >({
    usageDate: "",
    allergies: "",
    symptoms: "",
    extras: "",
    medicalAttention: false,
    hospitalName: "",
    prescriptions: "",
  });
  const [selectedReport, setSelectedReport] = useState<SelectedFileInfo | null>(
    null
  );
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleChange = (key: string, value: string | boolean) => {
    if (key === "medicalAttention" && value === false) {
      setSelectedReport(null);
    }
    setMedicalForm((prevForm) => ({ ...prevForm, [key]: value as any }));
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    const formatOptionsDate: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const formatOptionsTime: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const formattedDate =
      date.toLocaleDateString(undefined, formatOptionsDate) +
      " " +
      date.toLocaleTimeString([], formatOptionsTime);
    setSelectedDate(date);
    handleChange("usageDate", formattedDate);
    hideDatePicker();
  };

  const handleUploadReport = async () => {
    const processPickedFile = (fileData: SelectedFileInfo) => {
      setSelectedReport(fileData);
      console.log("Selected file:", JSON.stringify(fileData, null, 2));
      Alert.alert("File Selected", `Ready to upload: ${fileData.name}`);
      console.log(
        `Placeholder: Would upload ${fileData.name} (${fileData.size} bytes) from ${fileData.uri}`
      );
    };

    const pickDocument = async () => {
      try {
        const pickerResult = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });

        if (
          !pickerResult.canceled &&
          pickerResult.assets &&
          pickerResult.assets.length > 0
        ) {
          const asset = pickerResult.assets[0];
          const fileData: SelectedFileInfo = {
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType,
            size: asset.size,
          };
          processPickedFile(fileData);
        } else {
          console.log("User cancelled document picker.");
        }
      } catch (error) {
        console.error("Error picking document (Expo):", error);
        Alert.alert("Error", "An error occurred while selecting the document.");
      }
    };

    const pickImage = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to choose images."
        );
        return;
      }

      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const fileName =
            asset.fileName ||
            `photo_${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
          const fileData: SelectedFileInfo = {
            uri: asset.uri,
            name: fileName,
            mimeType: asset.mimeType || "image/jpeg",
            size: asset.fileSize,
          };
          processPickedFile(fileData);
        } else {
          console.log("User cancelled image picker.");
        }
      } catch (error) {
        console.error("Error picking image (Expo):", error);
        Alert.alert("Error", "An error occurred while selecting the image.");
      }
    };

    Alert.alert(
      "Upload Source",
      "Where would you like to select the report from?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Files App", onPress: pickDocument },
        { text: "Photo Library", onPress: pickImage },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = () => {
    const combinedMedicalData: MedicalHistoryFormState = {
      ...medicalForm,
      selectedReportInfo: selectedReport,
    };
    console.log("Collected Medical Data:", combinedMedicalData);
    console.log("Previously Collected Report Data:", reportData);

    navigation.navigate("ReviewSubmit", {
      reportData: reportData,
      medicalData: combinedMedicalData,
    });
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical History</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Incident Details</Text>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Date and Time of Consumption/Usage
              </Text>
              <TouchableOpacity
                onPress={showDatePicker}
                style={styles.inputContainer}
                activeOpacity={0.7}
              >
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Select Date and Time"
                  placeholderTextColor={COLORS.placeholder}
                  value={medicalForm.usageDate}
                  editable={false}
                  pointerEvents="none"
                />
                <View style={styles.iconContainer}>
                  <Feather name="calendar" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              date={selectedDate || new Date()}
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
            />

            <FormInput
              label="Known Allergies (if any)"
              value={medicalForm.allergies}
              onChangeText={(v: string) => handleChange("allergies", v)}
              multiline
              placeholder="e.g., Peanuts, Penicillin, None"
              numberOfLines={3}
            />
            <FormInput
              label="Symptoms Experienced"
              value={medicalForm.symptoms}
              onChangeText={(v: string) => handleChange("symptoms", v)}
              multiline
              placeholder="Describe the symptoms..."
              numberOfLines={4}
            />
            <FormInput
              label="Other Relevant Information"
              value={medicalForm.extras}
              onChangeText={(v: string) => handleChange("extras", v)}
              multiline
              placeholder="Any other details..."
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Medical Attention</Text>
            <View style={styles.toggleRowContainer}>
              <Text style={styles.toggleRowLabel}>
                Did you seek Medical Attention?
              </Text>
              <View style={styles.switchContainer}>
                <Text
                  style={[
                    styles.switchLabel,
                    !medicalForm.medicalAttention && styles.switchLabelActive,
                  ]}
                >
                  No
                </Text>
                <Switch
                  value={medicalForm.medicalAttention}
                  onValueChange={(v: boolean) =>
                    handleChange("medicalAttention", v)
                  }
                  trackColor={{
                    false: COLORS.switchTrackFalse,
                    true: COLORS.switchTrackTrue,
                  }}
                  thumbColor={
                    medicalForm.medicalAttention
                      ? COLORS.switchThumbActive
                      : COLORS.switchThumbInactive
                  }
                  ios_backgroundColor={COLORS.switchTrackFalse}
                  style={styles.switchControl}
                />
                <Text
                  style={[
                    styles.switchLabel,
                    medicalForm.medicalAttention && styles.switchLabelActive,
                  ]}
                >
                  Yes
                </Text>
              </View>
            </View>

            {medicalForm.medicalAttention && (
              <>
                <FormInput
                  label="Name of Hospital/Clinic Visited"
                  value={medicalForm.hospitalName}
                  onChangeText={(v: string) => handleChange("hospitalName", v)}
                  placeholder="Enter facility name"
                />
                <FormInput
                  label="Prescriptions Received (if any)"
                  value={medicalForm.prescriptions}
                  onChangeText={(v: string) => handleChange("prescriptions", v)}
                  multiline
                  placeholder="List prescriptions..."
                  numberOfLines={3}
                />
                {selectedReport && (
                  <View style={styles.selectedFileContainer}>
                    <Feather name="check-circle" size={16} color="green" />
                    <Text style={styles.selectedFileText} numberOfLines={1}>
                      Selected: {selectedReport.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedReport(null)}>
                      <Feather name="x-circle" size={16} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {medicalForm.medicalAttention && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadReport}
                activeOpacity={0.8}
              >
                <Feather
                  name="upload"
                  size={18}
                  color={COLORS.uploadButtonText}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.uploadText}>
                  {selectedReport ? "REPLACE REPORT" : "UPLOAD REPORT"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>REVIEW & SUBMIT</Text>
              <Feather
                name="arrow-right"
                size={18}
                color={COLORS.primary}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FormInput = ({
  label,
  multiline = false,
  rightIcon,
  style,
  ...props
}: any) => (
  <View style={styles.inputBlock}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, style]}
        placeholderTextColor={COLORS.placeholder}
        multiline={multiline}
        {...props}
      />
      {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    minHeight: 50,
  },
  backButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: COLORS.textLight,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 160,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  inputBlock: {
    marginBottom: 22,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    minHeight: 50,
  },
  input: {
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textDark,
    flex: 1,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  toggleRowContainer: {
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleRowLabel: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
    marginRight: 15,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
  switchLabelActive: {
    color: COLORS.secondary,
    fontWeight: "bold",
  },
  switchControl: {},
  selectedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: -10,
    marginBottom: 20,
    gap: 8,
  },
  selectedFileText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: COLORS.uploadButtonBackground,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  uploadText: {
    color: COLORS.uploadButtonText,
    fontWeight: "bold",
    fontSize: 15,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: COLORS.submitButtonBackground,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  submitText: {
    color: COLORS.submitButtonText,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default MedicalHistoryScreen;
