import React, { useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';

export interface UploadedFile {
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  dataUrl?: string;
  lastModified?: number;
}

export interface FileUploadProps {
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  currentFileName?: string;
  currentFileUrl?: string;
  onFileSelect: (file: UploadedFile) => void;
  onClear?: () => void;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  helperText?: string;
  error?: string;
  showSampleQuickPicker?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 10,
  currentFileName,
  currentFileUrl,
  onFileSelect,
  onClear,
  required = false,
  disabled = false,
  containerStyle,
  helperText,
  error,
  showSampleQuickPicker = true,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setLocalError(null);

    // Validate size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`File exceeds maximum size limit of ${maxSizeMB}MB (${formatFileSize(file.size)}).`);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      setIsProcessing(false);
      onFileSelect({
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        dataUrl,
        lastModified: file.lastModified,
      });
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setLocalError('Failed to read selected file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input value so re-selecting same file triggers change
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    if (disabled || isProcessing) return;
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Preset sample handler for easy testing
  const handleLoadSample = (sampleType: 'repair_photo' | 'bill_receipt' | 'noc_doc') => {
    if (sampleType === 'repair_photo') {
      onFileSelect({
        name: 'Plumbing_Leakage_Inspection.jpg',
        size: 384000,
        sizeFormatted: '375 KB',
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      });
    } else if (sampleType === 'bill_receipt') {
      onFileSelect({
        name: 'Tax_Invoice_Electrical_Spare.pdf',
        size: 840000,
        sizeFormatted: '820 KB',
        type: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
      });
    } else {
      onFileSelect({
        name: 'Society_Official_Gatepass.pdf',
        size: 512000,
        sizeFormatted: '500 KB',
        type: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
      });
    }
  };

  const hasFile = Boolean(currentFileName || currentFileUrl);
  const isImage = currentFileName?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || currentFileUrl?.startsWith('data:image/') || currentFileUrl?.includes('images.unsplash.com');
  const activeError = error || localError;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          {maxSizeMB && (
            <Text style={styles.maxSizeBadge}>Max {maxSizeMB}MB</Text>
          )}
        </View>
      )}

      {description && <Text style={styles.descriptionText}>{description}</Text>}

      {/* Hidden real file input element */}
      {Platform.OS === 'web' && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      )}

      {hasFile ? (
        /* Selected file display card */
        <View style={styles.selectedCard}>
          <View style={styles.fileHeader}>
            <View style={styles.fileIconWrapper}>
              <Text style={styles.fileIcon}>{isImage ? '🖼️' : '📄'}</Text>
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {currentFileName || 'Attached_Document.pdf'}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillDot}>●</Text>
                  <Text style={styles.statusPillText}>Ready & Attached</Text>
                </View>
                <Text style={styles.fileTypeHint}>
                  {isImage ? 'Image preview available' : 'Document file'}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                onPress={triggerPicker}
                style={({ pressed }) => [styles.smallBtn, pressed && styles.btnPressed]}
                accessibilityLabel="Replace file"
              >
                <Text style={styles.smallBtnText}>Replace</Text>
              </Pressable>
              {onClear && (
                <Pressable
                  onPress={onClear}
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
                  accessibilityLabel="Remove file"
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* If image data is available, show clean inline preview thumbnail */}
          {isImage && currentFileUrl && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: currentFileUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      ) : (
        /* Empty dropzone state */
        <div
          onClick={triggerPicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          <View
            style={[
              styles.dropzone,
              isDragging && styles.dropzoneActive,
              activeError ? styles.dropzoneError : null,
              disabled && styles.dropzoneDisabled,
            ]}
          >
            <View style={styles.dropzoneIconCircle}>
              <Text style={styles.dropzoneIcon}>{isProcessing ? '⏳' : '📁'}</Text>
            </View>

            <View style={styles.dropzoneContent}>
              <Text style={styles.dropzonePrimaryText}>
                {isProcessing
                  ? 'Reading file contents...'
                  : isDragging
                  ? 'Drop file here to upload'
                  : 'Click to browse or drag & drop file'}
              </Text>
              <Text style={styles.dropzoneSecondaryText}>
                Supports JPG, PNG, WEBP, PDF, DOCX (Up to {maxSizeMB}MB)
              </Text>
            </View>

            <Pressable
              onPress={triggerPicker}
              disabled={disabled || isProcessing}
              style={({ pressed }) => [
                styles.browseButton,
                pressed && styles.browseButtonPressed,
                disabled && styles.browseButtonDisabled,
              ]}
            >
              <Text style={styles.browseButtonText}>Choose File</Text>
            </Pressable>
          </View>
        </div>
      )}

      {/* Quick sample chips for instant demonstration & testing */}
      {showSampleQuickPicker && !hasFile && (
        <View style={styles.quickSamplesRow}>
          <Text style={styles.quickSamplesLabel}>Quick sample:</Text>
          <Pressable
            onPress={() => handleLoadSample('repair_photo')}
            style={({ pressed }) => [styles.sampleChip, pressed && styles.sampleChipPressed]}
          >
            <Text style={styles.sampleChipText}>📸 Damage Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => handleLoadSample('bill_receipt')}
            style={({ pressed }) => [styles.sampleChip, pressed && styles.sampleChipPressed]}
          >
            <Text style={styles.sampleChipText}>🧾 Bill Receipt</Text>
          </Pressable>
          <Pressable
            onPress={() => handleLoadSample('noc_doc')}
            style={({ pressed }) => [styles.sampleChip, pressed && styles.sampleChipPressed]}
          >
            <Text style={styles.sampleChipText}>📑 Society Pass</Text>
          </Pressable>
        </View>
      )}

      {activeError ? (
        <Text style={styles.errorText}>⚠️ {activeError}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  requiredStar: {
    color: colors.danger.main,
    fontWeight: typography.weights.bold,
  },
  maxSizeBadge: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  descriptionText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dropzoneActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  dropzoneError: {
    borderColor: colors.danger.main,
    backgroundColor: colors.danger.background,
  },
  dropzoneDisabled: {
    opacity: 0.6,
    backgroundColor: colors.neutral[100],
  },
  dropzoneIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  dropzoneIcon: {
    fontSize: 22,
  },
  dropzoneContent: {
    alignItems: 'center',
  },
  dropzonePrimaryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dropzoneSecondaryText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  browseButtonPressed: {
    backgroundColor: colors.neutral[100],
  },
  browseButtonDisabled: {
    opacity: 0.5,
  },
  browseButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.primary[700],
  },
  selectedCard: {
    borderWidth: 1,
    borderColor: colors.success.border,
    backgroundColor: colors.success.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success.border,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#bbf7d0',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  statusPillDot: {
    fontSize: 7,
    color: '#15803d',
  },
  statusPillText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semibold,
    color: '#15803d',
  },
  fileTypeHint: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  smallBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: spacing.xs - 1,
  },
  smallBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  deleteBtn: {
    backgroundColor: colors.danger.background,
    borderWidth: 1,
    borderColor: colors.danger.border,
    borderRadius: borderRadius.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.danger.text,
  },
  btnPressed: {
    opacity: 0.7,
  },
  imagePreviewContainer: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
    maxHeight: 180,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    backgroundColor: colors.neutral[100],
  },
  quickSamplesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  quickSamplesLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  sampleChip: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
  },
  sampleChipPressed: {
    backgroundColor: colors.neutral[200],
  },
  sampleChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger.main,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
