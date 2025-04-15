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
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { COLORS } from "../../../styles/colors"; // Path from src/screens/ to styles/
//import type { LoginNavigatorParamList } from "../../navigators/login_navigator"; // Use LoginNavigator's types
import type { MainStackParamList } from "../../navigators/main_navigator"; // Import from main_navigator
import type { ReportFormState } from "../../navigators/types"; // Import data structure type
import ScannerModal from "../../components/ScannerModal"; // Adjust path if needed
import type { ScanResultData } from "../../components/ScannerModal"; // Adjust path if needed

type ReportIncidentNavigationProp = StackNavigationProp<
  MainStackParamList,
  "ReportIncident"
>;

const ReportIncidentScreen = () => {
  const navigation = useNavigation<ReportIncidentNavigationProp>();

  const [form, setForm] = useState<ReportFormState>({
    fullName: "",
    email: "",
    reportType: "Product",
    identifier: "",
    productName: "",
    category: "",
    specifications: "",
    issueReview: "",
  });

  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const handleChange = (
    key: keyof ReportFormState,
    value: string | boolean
  ) => {
    setForm((prevForm) => ({ ...prevForm, [key]: value }));
  };

  const handleReportTypeChange = (type: "Product" | "Drug") => {
    handleChange("reportType", type);
  };

  const handleScanPress = () => {
    setIsScannerVisible(true);
  };

  const handleScanSuccess = (scanData: ScanResultData) => {
    setForm((prevForm) => ({
      ...prevForm,
      identifier: scanData.identifier || prevForm.identifier,
      productName: scanData.name || "",
      category: scanData.category || "",
      specifications: scanData.specifications || "",
    }));
    setIsScannerVisible(false);
    Alert.alert(
      "Scan Success",
      `Populated details for ${scanData.name || "item"}.`
    );
  };

  const handleScanError = (message: string) => {
    setIsScannerVisible(false);
    Alert.alert("Scan Error", message || "Could not process barcode.");
  };

  const handleNext = (): void => {
    console.log("Report Incident Form Data:", form);
    navigation.navigate("MedicalHistory", { reportData: form });
  };

  const goBack = (): void => {
    navigation.goBack();
  };

  const identifierLabel =
    form.reportType === "Product"
      ? "Product Identifier (UPC / Barcode)"
      : "Drug Identifier (NDC / Barcode)";
  const identifierPlaceholder =
    form.reportType === "Product"
      ? "Scan or enter product identifier"
      : "Scan or enter drug identifier";
  const nameLabel =
    form.reportType === "Product" ? "Product Name" : "Drug / Medication Name";
  const namePlaceholder =
    form.reportType === "Product"
      ? "e.g., Organic Whole Milk, Crunchy Oats Cereal"
      : "e.g., Allergy Relief Tablets, Ibuprofen Caplets";
  const categoryLabel =
    form.reportType === "Product" ? "Product Category" : "Drug Category";
  const categoryPlaceholder =
    form.reportType === "Product"
      ? "e.g., Dairy, Beverage, Snack Food"
      : "e.g., Antihistamine, Pain Relief, OTC";
  const specsLabel =
    form.reportType === "Product"
      ? "Specifications / Details"
      : "Dosage / Strength / Form";
  const specsPlaceholder =
    form.reportType === "Product"
      ? "e.g., 1 Gallon, 12 oz Box, Expires 2025-12-31"
      : "e.g., 24 Tablets, 200mg, 10ml Liquid";

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
          <Text style={styles.headerTitle}>Report an Issue</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleButtonLeft,
                  form.reportType === "Product" && styles.toggleButtonActive,
                ]}
                onPress={() => handleReportTypeChange("Product")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    form.reportType === "Product" &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Product
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleButtonRight,
                  form.reportType === "Drug" && styles.toggleButtonActive,
                ]}
                onPress={() => handleReportTypeChange("Drug")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    form.reportType === "Drug" && styles.toggleButtonTextActive,
                  ]}
                >
                  Drug
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Information</Text>
            <FormInput
              label="Full Name"
              value={form.fullName}
              onChangeText={(v: string) => handleChange("fullName", v)}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
            <FormInput
              label="Email Address"
              value={form.email}
              onChangeText={(v: string) => handleChange("email", v)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.sectionTitle}>{form.reportType} Details</Text>
            <FormInput
              label={identifierLabel}
              value={form.identifier}
              onChangeText={(v: string) => handleChange("identifier", v)}
              placeholder={identifierPlaceholder}
              rightIcon={
                <TouchableOpacity
                  onPress={handleScanPress}
                  style={styles.iconButton}
                >
                  <Feather name="camera" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              }
            />
            <FormInput
              label={nameLabel}
              value={form.productName}
              onChangeText={(v: string) => handleChange("productName", v)}
              placeholder={namePlaceholder}
              autoCapitalize="words"
            />
            <FormInput
              label={categoryLabel}
              value={form.category}
              onChangeText={(v: string) => handleChange("category", v)}
              placeholder={categoryPlaceholder}
              autoCapitalize="sentences"
            />
            <FormInput
              label={specsLabel}
              value={form.specifications}
              onChangeText={(v: string) => handleChange("specifications", v)}
              placeholder={specsPlaceholder}
            />
            <FormInput
              label="Detailed Review about Issue"
              multiline
              value={form.issueReview}
              onChangeText={(v: string) => handleChange("issueReview", v)}
              placeholder="Please describe the problem or reaction..."
              numberOfLines={5}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>NEXT: MEDICAL HISTORY</Text>
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

      <ScannerModal
        isVisible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
        onError={handleScanError}
        reportType={form.reportType}
      />
    </SafeAreaView>
  );
};

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  multiline?: boolean;
  rightIcon?: React.ReactNode;
};

const FormInput = ({
  label,
  multiline = false,
  rightIcon,
  style,
  ...props
}: FormInputProps) => (
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
    paddingBottom: 120,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 10,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  toggleButtonRight: {
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.activeHighlight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleButtonText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  toggleButtonTextActive: {
    color: COLORS.activeHighlightText,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
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
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textDark,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  iconButton: {
    padding: 5,
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
  submitButton: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
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
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ReportIncidentScreen;
