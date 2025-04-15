import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ImageBackground, View, Modal, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SifterSearch } from "~/network/network_request";
import Page from "~/FDAtest";
import { error, log, t } from '~/utility/utility';
import Feather from 'react-native-vector-icons/Feather'; // For close button
import { COLORS } from '../../styles/colors'; // Go up three levels, then into styles

// Define the structure of the data returned on successful scan and processing
// *** Adjust this interface based on your actual API response from Page() ***
export interface ScanResultData {
    identifier: string; // The scanned barcode (UPC/NDC)
    name?: string;
    category?: string;
    specifications?: string; // e.g., brand, size, etc.
    // Add any other relevant fields returned by your Page function
}

interface ScannerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onScanSuccess: (data: ScanResultData) => void;
  onError: (message: string) => void;
  reportType: 'Product' | 'Drug'; // To adjust search/expectations if needed
}

export default function ScannerModal({ isVisible, onClose, onScanSuccess, onError, reportType }: ScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned_time = useRef(new Date().getTime());
  const [isProcessing, setIsProcessing] = useState(false); // To prevent multiple scans while one is processing

  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible, permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || !isVisible) {
      return; // Don't process if already processing, or modal not visible
    }

    // --- Debounce Logic ---
    const now = new Date().getTime();
    if (now - scanned_time.current <= 1500) { // Increased timeout slightly
      return;
    }
    scanned_time.current = now;
    setIsProcessing(true); // Mark as processing

    log("Raw Scanned Data:", data);

    // --- Format UPC/Identifier (adjust based on Drug/Product if needed) ---
    let identifier = data;
    // Example: Basic UPC-A formatting (remove leading 0 if 13 digits, assuming EAN)
    if (identifier.length === 13 && identifier.startsWith('0')) {
      identifier = identifier.substring(1);
    } else if (identifier.length === 12) {
        // Standard UPC-A, likely okay
    }
    // Add more specific formatting for NDC if reportType is 'Drug'

    log(`Scanning for ${reportType} with identifier:`, identifier);

    try {
      // --- API Calls ---
      const results = await SifterSearch(identifier, 'upc', 1); // Assuming 'upc' works for both or adjust based on type
      log("SifterSearch Results:", results);

      if (results.Pinfo == undefined || results.Pinfo.length == 0) {
        throw new Error("Product/Drug information not found for this barcode.");
      }

      // Assuming Page function enhances the first result
      const pageResults = await Page(results.Pinfo[0]);
      log("FDA Page Results:", pageResults);

      if (!pageResults || !pageResults.Pinfo) {
          throw new Error("Detailed information could not be retrieved.");
      }

      // --- Map results to ScanResultData (ADJUST FIELD NAMES BASED ON YOUR ACTUAL RESPONSE) ---
      const scanResultData: ScanResultData = {
        identifier: identifier, // Use the formatted identifier
        name: pageResults.Pinfo.name || pageResults.Pinfo.description, // Example mapping
        category: pageResults.Pinfo.category, // Example mapping
        specifications: pageResults.Pinfo.brand_name || pageResults.Pinfo.package_size, // Combine fields if needed
        // Add other relevant fields
      };

      log("Scan Success - Passing Data:", scanResultData);
      onScanSuccess(scanResultData); // Pass data back

    } catch (err: any) {
      error("Scanning/Processing Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during scanning.";
      onError(errorMessage); // Pass error message back
    } finally {
      setIsProcessing(false); // Reset processing state
      // Keep modal open until parent closes it via onScanSuccess/onError callbacks
      // onClose(); // Optionally close immediately
    }
  };

  if (!isVisible) {
      return null; // Don't render anything if not visible
  }

  if (!permission) {
    return (
      <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission denied. Please grant permission in settings.</Text>
           <TouchableOpacity onPress={requestPermission} style={styles.requestButton}><Text style={styles.requestButtonText}>Grant Permission</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
        visible={isVisible}
        onRequestClose={onClose}
        animationType="slide"
    >
        <CameraView
            onBarcodeScanned={!isProcessing ? handleBarCodeScanned : undefined} // Disable scanning while processing
            barcodeScannerSettings={{
                barcodeTypes: ["ean13", "upc_a", "upc_e"], // Add others like code128 if needed for NDCs
            }}
            style={StyleSheet.absoluteFillObject}
        >
            {/* Optional: Overlay UI */}
            <ImageBackground
                source={require('assets/newLayer.png')} // Make sure this path is correct
                style={styles.overlay}
                resizeMode="contain" // Or 'cover', 'stretch' as needed
            >
                 {/* Processing Indicator */}
                {isProcessing && (
                    <View style={styles.processingIndicator}>
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}
                {/* Close Button */}
                <TouchableOpacity onPress={onClose} style={styles.closeButtonAbsolute}>
                    <Feather name="x" size={30} color="#fff" />
                </TouchableOpacity>
                 {/* You can add viewfinder lines or hints here */}
            </ImageBackground>
        </CameraView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.primary, // Use theme color
  },
  permissionText: {
    color: COLORS.textLight, // Use theme color
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
   requestButton: {
      backgroundColor: COLORS.secondary, // Use theme color
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
      marginBottom: 15,
  },
  requestButtonText: {
      color: COLORS.primary, // Use theme color
      fontSize: 16,
      fontWeight: 'bold',
  },
  closeButton: {
      marginTop: 10,
      padding: 10,
  },
   closeButtonText: {
      color: COLORS.textMuted, // Use theme color
      fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure overlay doesn't block camera view unnecessarily
    justifyContent: 'center', // Example positioning
    alignItems: 'center',
  },
  closeButtonAbsolute: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar/notch
      left: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 20,
      padding: 5,
  },
  processingIndicator: {
      position: 'absolute',
      bottom: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
  },
  processingText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
  },
});