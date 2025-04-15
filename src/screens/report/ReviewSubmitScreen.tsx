import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../../styles/colors'; // Adjust path
import type { MainStackParamList } from '../../navigators/main_navigator'; // Adjust path
import type { ReviewSubmitRouteParams } from '../../navigators/types'; // Adjust path

type ReviewSubmitNavigationProp = StackNavigationProp<MainStackParamList, 'ReviewSubmit'>;
type ReviewSubmitRouteProp = RouteProp<MainStackParamList, 'ReviewSubmit'>;


const ReviewRow = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (value === undefined || value === null || value === '') return null;
    return ( <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{value}</Text></View> );
};

const SectionHeader = ({ title, onEditPress }: { title: string; onEditPress: () => void }) => (
    <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>{title}</Text><TouchableOpacity style={styles.editButton} onPress={onEditPress}><Feather name="edit-2" size={16} color={COLORS.secondary} /><Text style={styles.editButtonText}>Edit Section</Text></TouchableOpacity></View>
);


const ReviewSubmitScreen = () => {
  const navigation = useNavigation<ReviewSubmitNavigationProp>();
  const route = useRoute<ReviewSubmitRouteProp>();
  const { reportData, medicalData } = route.params;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditReport = () => { navigation.navigate('ReportIncident'); };
  const handleEditMedical = () => { navigation.navigate('MedicalHistory', { reportData: reportData }); };
  const goBack = () => { navigation.goBack(); };

  const handleSendOtp = async () => {
    const formattedPhoneNumber = phoneNumber.replace(/[\s()-]/g, '');
    if (!formattedPhoneNumber.startsWith('+') || formattedPhoneNumber.length < 11) {
      setVerificationError("Please use format +1XXXXXXXXXX.");
      return;
    }
    setVerificationError(null);
    setIsVerificationLoading(true);

    const YOUR_BACKEND_SEND_OTP_URL = 'http://YOUR_LOCAL_IP_OR_DEPLOYED_URL:3000/api/send-twilio-otp'; // <<< REPLACE

    try {
      console.log(`Requesting OTP via backend for ${formattedPhoneNumber}...`);
      const response = await fetch(YOUR_BACKEND_SEND_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
      });

      const contentType = response.headers.get("content-type");
      let responseData;
      if (contentType && contentType.indexOf("application/json") !== -1) {
          responseData = await response.json();
      } else {
          if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
          }
          responseData = { success: true };
      }

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to send OTP via server.');
      }

      console.log('OTP Sent successfully request succeeded.');
      setIsOtpSent(true);
      Alert.alert('Code Sent', 'An OTP should arrive shortly.');

    } catch (error: any) {
      console.error("Send OTP Backend Error:", error);
      if (error instanceof TypeError && error.message === 'Network request failed') {
          setVerificationError('Cannot connect to the server. Please check your network and ensure the backend is running.');
          Alert.alert('Network Error', 'Could not connect to the server.');
      } else {
          setVerificationError(error.message || 'An error occurred sending the code.');
          Alert.alert('Error', error.message || 'Could not send OTP.');
      }
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const formattedPhoneNumber = phoneNumber.replace(/[\s()-]/g, '');
    if (!otpCode || otpCode.length < 4) {
      setVerificationError("Please enter the received OTP code.");
      return;
    }
    setVerificationError(null);
    setIsVerificationLoading(true);

    const YOUR_BACKEND_CHECK_OTP_URL = 'http://YOUR_LOCAL_IP_OR_DEPLOYED_URL:3000/api/check-twilio-otp'; // <<< REPLACE

    try {
      console.log(`Verifying OTP ${otpCode} for ${formattedPhoneNumber} via backend...`);
       const response = await fetch(YOUR_BACKEND_CHECK_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber, otpCode: otpCode }),
      });

       const contentType = response.headers.get("content-type");
       let responseData;
       if (contentType && contentType.indexOf("application/json") !== -1) {
           responseData = await response.json();
       } else {
           if (!response.ok) {
               throw new Error(`Server responded with status: ${response.status}`);
           }
           throw new Error('Invalid response format from server.');
       }

      if (!response.ok || !responseData.success || responseData.status !== 'approved') {
         throw new Error(responseData.error || 'Invalid or expired OTP code.');
      }

      console.log('OTP Verified successfully via backend.');
      setIsOtpVerified(true);
      Alert.alert('Success', 'Phone number verified successfully!');

    } catch (error: any) {
      console.error("Verify OTP Backend Error:", error);
       if (error instanceof TypeError && error.message === 'Network request failed') {
          setVerificationError('Cannot connect to the server. Please check your network and ensure the backend is running.');
          Alert.alert('Network Error', 'Could not connect to the server.');
      } else {
        setVerificationError(error.message || 'An error occurred during verification.');
        Alert.alert('Error', error.message || 'Could not verify OTP.');
      }
    } finally {
      setIsVerificationLoading(false);
    }
  };


  const handleFinalSubmit = () => {
    if (!isOtpVerified) {
        Alert.alert("Verification Required", "Please complete phone number verification before submitting.");
        return;
    }
    // Removed Captcha check

    setIsSubmitting(true);
    setVerificationError(null);

    const submissionData = {
        reportDetails: reportData,
        medicalDetails: { ...medicalData, phoneNumberVerified: phoneNumber.replace(/[\s()-]/g, '') },
        submittedAt: new Date().toISOString(),
      };
    const backendUrl = 'YOUR_BACKEND_API_ENDPOINT/api/reports'; // <<< REPLACE THIS URL
    const jsonData = JSON.stringify(submissionData);

    console.log(`FINAL SUBMISSION to ${backendUrl}:`, jsonData);
    Alert.alert("Submission Sent (Placeholder)", "Your report would be sent to the backend now.");
    // TODO: Replace placeholder alert with actual fetch POST
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
       <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & Submit</Text>
          <View style={{ width: 40 }} />
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Report Data Section */}
        <SectionHeader title={`About ${reportData.reportType}`} onEditPress={handleEditReport} />
        <View style={styles.sectionContent}>{/* Review Rows */}
             <ReviewRow label="Identifier (UPC/NDC)" value={reportData.identifier} />
             <ReviewRow label={`${reportData.reportType} Name`} value={reportData.productName} />
             <ReviewRow label="Category" value={reportData.category} />
             <ReviewRow label="Specifications" value={reportData.specifications} />
             <ReviewRow label="Issue Review" value={reportData.issueReview} />
             <ReviewRow label="Reporter Name" value={reportData.fullName} />
             <ReviewRow label="Reporter Email" value={reportData.email} />
        </View>

        {/* Medical History Section */}
        <SectionHeader title="About Problem & Medical History" onEditPress={handleEditMedical} />
        <View style={styles.sectionContent}>{/* Review Rows */}
             <ReviewRow label="Date/Time of Use/Consumption" value={medicalData.usageDate} />
             <ReviewRow label="Known Allergies" value={medicalData.allergies} />
             <ReviewRow label="Symptoms Experienced" value={medicalData.symptoms} />
             <ReviewRow label="Sought Medical Attention" value={medicalData.medicalAttention ? 'Yes' : 'No'} />
             {medicalData.medicalAttention && (
                 <>
                     <ReviewRow label="Hospital/Clinic Visited" value={medicalData.hospitalName} />
                     <ReviewRow label="Prescriptions Received" value={medicalData.prescriptions} />
                     <ReviewRow label="Uploaded Report File" value={medicalData.selectedReportInfo?.name} />
                 </>
             )}
              <ReviewRow label="Other Information" value={medicalData.extras} />
        </View>

        {/* REMOVED ReCAPTCHA Placeholder Section */}
        {/* <View style={styles.verificationSection}> ... </View> */}

        {/* Phone Verification Section */}
        <View style={styles.verificationSection}>
            <Text style={styles.verificationTitle}>Phone Verification</Text>
            <Text style={styles.verificationSubtitle}>
                {isOtpVerified ? "Your phone number has been verified." : "A code will be sent via SMS to verify this submission."}
            </Text>

            {!isOtpVerified ? (
              <>
                {!isOtpSent ? (
                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Phone Number (e.g., +14155552671)</Text>
                    {/* Modified inputContainer for phone number */}
                    <View style={[styles.inputContainer, styles.phoneInputContainer]}>
                        <TextInput
                            // Modified style for phone input width
                            style={[styles.input, styles.phoneInput]}
                            placeholder="+1XXXXXXXXXX"
                            placeholderTextColor={COLORS.placeholder}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                            editable={!isVerificationLoading}
                            autoComplete="tel"
                        />
                        <TouchableOpacity
                            style={[styles.sendOtpButton, (isVerificationLoading || !phoneNumber || phoneNumber.length < 11) && styles.buttonDisabled]}
                            onPress={handleSendOtp}
                            disabled={isVerificationLoading || !phoneNumber || phoneNumber.length < 11}
                            activeOpacity={0.7}
                        >
                            {isVerificationLoading ? (<ActivityIndicator size="small" color={COLORS.primary} />) : (<Text style={styles.sendOtpButtonText}>Send Code</Text>)}
                        </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                   <View style={styles.inputBlock}>
                     <Text style={styles.label}>Enter OTP Code Sent to {phoneNumber}</Text>
                     <View style={styles.inputContainer}>
                         <TextInput
                             style={styles.input} // OTP input can take full width
                             placeholder="Enter code"
                             placeholderTextColor={COLORS.placeholder}
                             value={otpCode}
                             onChangeText={setOtpCode}
                             keyboardType="number-pad"
                             maxLength={10}
                             editable={!isVerificationLoading}
                             textContentType="oneTimeCode"
                         />
                     </View>
                     <TouchableOpacity
                        style={[styles.verifyOtpButton, (isVerificationLoading || !otpCode || otpCode.length < 4) && styles.buttonDisabled]}
                        onPress={handleVerifyOtp}
                        disabled={isVerificationLoading || !otpCode || otpCode.length < 4}
                        activeOpacity={0.7}
                    >
                        {isVerificationLoading ? (<ActivityIndicator size="small" color={COLORS.primary} />) : (<Text style={styles.verifyOtpButtonText}>Verify Code</Text>)}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resendButton, isVerificationLoading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={isVerificationLoading}>
                         <Text style={styles.resendButtonText}>Resend Code?</Text>
                    </TouchableOpacity>
                   </View>
                )}
                {verificationError && (<Text style={styles.errorText}>{verificationError}</Text>)}
              </>
            ) : (
                <View style={styles.verifiedContainer}>
                    <Feather name="check-circle" size={24} color="green" />
                    <Text style={styles.verifiedText}>Phone Number Verified</Text>
                </View>
            )}
        </View>
        {/* End Phone Verification Section */}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
            // Removed captcha check from disabled condition
            style={[styles.submitButton, (!isOtpVerified || isSubmitting) && styles.buttonDisabled]}
            onPress={handleFinalSubmit}
            activeOpacity={(isOtpVerified && !isSubmitting) ? 0.8 : 1}
            disabled={!isOtpVerified || isSubmitting}
        >
          {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
              <>
                  {/* Removed captcha check from text style condition */}
                  <Text style={[styles.submitText, !isOtpVerified && styles.submitTextDisabled]}>
                      SUBMIT FINAL REPORT
                  </Text>
                  {/* Removed captcha check from icon color condition */}
                  <Feather name="send" size={18} color={!isOtpVerified ? COLORS.textMuted : COLORS.primary} style={{ marginLeft: 8 }}/>
              </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.primary },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle, minHeight: 50 },
    backButton: { padding: 8, justifyContent: 'center', alignItems: 'center', width: 40, height: 40 },
    headerTitle: { color: COLORS.textLight, fontSize: 20, fontWeight: '600', textAlign: 'center' },
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 120 },
    sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
    sectionTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '600' },
    editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundSubtle, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
    editButtonText: { color: COLORS.secondary, fontSize: 13, fontWeight: '500', marginLeft: 5 },
    sectionContent: { backgroundColor: COLORS.backgroundSubtle, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15 },
    reviewRow: { flexDirection: 'column', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
    reviewLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 4 },
    reviewValue: { color: COLORS.textLight, fontSize: 15, fontWeight: '400', lineHeight: 21 },
    verificationSection: { marginTop: 30, marginBottom: 15, paddingHorizontal: 5 },
    verificationTitle: { color: COLORS.textLight, fontSize: 16, fontWeight: '600', marginBottom: 5 },
    verificationSubtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    placeholderBox: { backgroundColor: COLORS.backgroundSubtle, borderRadius: 8, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderSubtle, minHeight: 100 },
    placeholderText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 },
    inputBlock: { marginBottom: 15 },
    label: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8, fontWeight: '500' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: '#d0d0d0', minHeight: 50 },
    // Style added specifically for the phone input row container if needed (currently unused but available)
    phoneInputContainer: {
        // Can add specific styles here like justifyContent: 'space-between' if needed
    },
    input: {
        // Removed flex: 1 by default, let parent control or apply directly
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.textDark,
    },
    // Style added specifically for the phone input field itself
    phoneInput: {
        flexGrow: 1, // Let it take available space before button
        flexShrink: 1, // Allow it to shrink if needed
        // Remove explicit width: '65%' - let flexbox handle it better with the button's fixed width
    },
    multilineInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 14 },
    iconContainer: { paddingHorizontal: 12 },
    sendOtpButton: { backgroundColor: COLORS.secondary, paddingHorizontal: 15, height: 50, // Match minHeight of inputContainer
        marginLeft: 8, // Add some space between input and button
        justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 9, borderBottomRightRadius: 9, minWidth: 100 },
    sendOtpButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
    verifyOtpButton: { backgroundColor: COLORS.secondary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    verifyOtpButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
    buttonDisabled: { opacity: 0.5, backgroundColor: '#cccccc' },
    errorText: { color: '#FF6B6B', fontSize: 14, marginTop: 8, textAlign: 'center' },
    resendButton: { marginTop: 15, alignItems: 'center' },
    resendButtonText: { color: COLORS.secondary, fontSize: 14, textDecorationLine: 'underline' },
    verifiedContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, backgroundColor: 'rgba(0, 255, 0, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'green' },
    verifiedText: { color: 'green', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    footer: { paddingVertical: 15, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, backgroundColor: COLORS.primary, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
    submitButton: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 4 },
    submitText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    submitTextDisabled: { color: COLORS.textMuted },
});

export default ReviewSubmitScreen;