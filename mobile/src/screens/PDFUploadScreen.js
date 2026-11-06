import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PrimaryButton } from '../components/PrimaryButton';

export const PDFUploadScreen = ({ navigation }) => {
  const { addDocument, setActiveDocumentContext } = useApp();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: not started, 1: uploading, 2: extracting, 3: chunks, 4: ready
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorState, setErrorState] = useState(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 20 * 1024 * 1024) {
          setErrorState('File exceeds maximum allowed size of 20MB.');
          return;
        }
        setSelectedFile({
          name: file.name,
          size: file.size,
          uri: file.uri,
          mimeType: file.mimeType || 'application/pdf',
          file: file.file,
        });
        setErrorState(null);
        setCurrentStep(0);
        setProgressPercent(0);
      }
    } catch (err) {
      console.warn('Error picking document:', err);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a PDF file first.');
      return;
    }

    setIsUploading(true);
    setErrorState(null);
    setCurrentStep(1);
    setProgressPercent(25);

    try {
      // Step 2: Extracting text
      const t1 = setTimeout(() => {
        setCurrentStep(2);
        setProgressPercent(50);
      }, 500);

      // Step 3: Semantic chunking & indexing
      const t2 = setTimeout(() => {
        setCurrentStep(3);
        setProgressPercent(75);
      }, 1000);

      const newDoc = await api.documents.upload(selectedFile);
      clearTimeout(t1);
      clearTimeout(t2);

      setCurrentStep(4);
      setProgressPercent(100);
      addDocument(newDoc);
      setActiveDocumentContext(newDoc);

      setTimeout(() => {
        navigation.navigate(ROUTES.DOCUMENT_DETAILS, {
          documentId: newDoc.id,
        });
      }, 800);
    } catch (err) {
      setErrorState(err.message || 'Processing failed. Please check the PDF format and retry.');
      setCurrentStep(0);
      setProgressPercent(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.TAB_HOME });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload PDF</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Dropzone Card */}
        <TouchableOpacity
          style={styles.dropZone}
          onPress={handlePickDocument}
          activeOpacity={0.8}
        >
          <View style={styles.cloudCircle}>
            <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.dropZoneMain}>Tap to select PDF</Text>
          <Text style={styles.dropZoneSub}>or drag and drop</Text>
          <Text style={styles.dropZoneLimit}>Supported: PDF (max 20MB)</Text>
        </TouchableOpacity>

        {/* Selected File Card */}
        {selectedFile && (
          <View style={[styles.selectedCard, SHADOWS.subtle]}>
            <View style={styles.fileIconBox}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>
                {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedFile(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner */}
        {errorState && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorState}</Text>
          </View>
        )}

        {/* Upload Button */}
        <PrimaryButton
          title={isUploading ? "Processing Document..." : "Upload & Analyze PDF"}
          onPress={handleStartUpload}
          loading={isUploading}
          disabled={!selectedFile || isUploading}
          style={styles.uploadBtn}
        />

        {/* Processing Section */}
        {(isUploading || currentStep > 0) && (
          <View style={[styles.processingCard, SHADOWS.subtle]}>
            <Text style={styles.processingTitle}>
              {currentStep >= 4 ? "Processing Complete!" : "Processing Document..."}
            </Text>

            {/* Checklist Step 1 */}
            <View style={styles.checkStepRow}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotCompleted]}>
                <Ionicons name="checkmark" size={12} color={COLORS.textWhite} />
              </View>
              <Text style={styles.stepText}>1. Uploading file to server</Text>
              {currentStep >= 1 && (
                <Ionicons name="checkmark" size={16} color={COLORS.success} style={styles.stepStatusIcon} />
              )}
            </View>

            {/* Checklist Step 2 */}
            <View style={styles.checkStepRow}>
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotCompleted]}>
                <Ionicons name="checkmark" size={12} color={COLORS.textWhite} />
              </View>
              <Text style={styles.stepText}>2. Extracting text & counting pages</Text>
              {currentStep >= 2 && (
                <Ionicons name="checkmark" size={16} color={COLORS.success} style={styles.stepStatusIcon} />
              )}
            </View>

            {/* Checklist Step 3 */}
            <View style={styles.checkStepRow}>
              <View style={[styles.stepDot, currentStep >= 3 ? styles.stepDotCompleted : styles.stepDotPending]}>
                {currentStep >= 3 && <Ionicons name="checkmark" size={12} color={COLORS.textWhite} />}
              </View>
              <Text style={[styles.stepText, currentStep < 3 && styles.stepTextPending]}>
                3. Splitting into semantic chunks
              </Text>
              {currentStep >= 3 ? (
                <Ionicons name="checkmark" size={16} color={COLORS.success} style={styles.stepStatusIcon} />
              ) : (
                <View style={styles.stepCircleOutline} />
              )}
            </View>

            {/* Checklist Step 4 */}
            <View style={styles.checkStepRow}>
              <View style={[styles.stepDot, currentStep >= 4 ? styles.stepDotCompleted : styles.stepDotPending]}>
                {currentStep >= 4 && <Ionicons name="checkmark" size={12} color={COLORS.textWhite} />}
              </View>
              <Text style={[styles.stepText, currentStep < 4 && styles.stepTextPending]}>
                4. Generating RAG vector embeddings
              </Text>
              {currentStep >= 4 ? (
                <Ionicons name="checkmark" size={16} color={COLORS.success} style={styles.stepStatusIcon} />
              ) : (
                <View style={styles.stepCircleOutline} />
              )}
            </View>

            {/* Progress Bar & Percentage */}
            <View style={styles.progressRow}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
          </View>
        )}

        {errorState && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{errorState}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  dropZone: {
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.surface,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cloudCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropZoneMain: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dropZoneSub: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dropZoneLimit: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  uploadBtn: {
    borderRadius: 14,
    marginBottom: 24,
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  processingTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  checkStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepDotPending: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  stepText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  stepTextPending: {
    color: COLORS.textMuted,
  },
  stepStatusIcon: {
    marginLeft: 'auto',
  },
  stepCircleOutline: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginLeft: 'auto',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceSubtle,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: SIZES.fontXs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    marginTop: 14,
  },
  errorText: {
    fontSize: SIZES.fontXs,
    color: COLORS.danger,
    marginLeft: 8,
    fontWeight: '600',
  },
});
