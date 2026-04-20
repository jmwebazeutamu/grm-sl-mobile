import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { apiErrorMessage } from '@/lib/api';
import { pickFromCamera, pickFromLibrary, useUploadAttachment } from '@/hooks/useUploadAttachment';

interface Attachment {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: string | null;
}

export function AttachmentsPanel({
  grievanceId,
  attachments,
  canUpload,
}: {
  grievanceId: number;
  attachments: Attachment[];
  canUpload: boolean;
}) {
  const upload = useUploadAttachment(grievanceId);

  async function handlePick(source: 'camera' | 'library') {
    const asset = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (!asset) {
      if (source === 'camera') {
        Alert.alert('Camera unavailable', 'Permission denied or no camera detected.');
      }
      return;
    }
    upload.mutate(
      { asset },
      { onError: (err) => Alert.alert('Upload failed', apiErrorMessage(err)) },
    );
  }

  return (
    <>
      <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Attachments</Text>
      <Card>
        {attachments.length === 0 ? (
          <Text className="text-muted text-sm">No attachments yet.</Text>
        ) : (
          attachments.map((a) => (
            <View key={a.id} className="flex-row items-center gap-3 py-1.5">
              <Ionicons name="document-attach-outline" size={18} color="#64748b" />
              <View className="flex-1">
                <Text className="text-navy text-sm font-medium" numberOfLines={1}>
                  {a.original_name}
                </Text>
                <Text className="text-muted text-xs">
                  {formatSize(a.size_bytes)}
                  {a.uploaded_by ? ` · ${a.uploaded_by}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}

        {canUpload ? (
          <View className="flex-row gap-2 mt-3">
            <UploadButton
              icon="camera-outline"
              label="Take photo"
              onPress={() => handlePick('camera')}
              disabled={upload.isPending}
            />
            <UploadButton
              icon="image-outline"
              label="Gallery"
              onPress={() => handlePick('library')}
              disabled={upload.isPending}
            />
          </View>
        ) : null}

        {upload.isPending ? (
          <View className="flex-row items-center gap-2 mt-3">
            <ActivityIndicator size="small" color="#0f2044" />
            <Text className="text-muted text-sm">Uploading…</Text>
          </View>
        ) : null}
      </Card>
    </>
  );
}

function UploadButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: 'camera-outline' | 'image-outline';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 flex-row items-center justify-center gap-2 py-2 rounded-md border ${
        disabled ? 'border-border opacity-50' : 'border-navy/30 active:bg-navy/5'
      }`}
    >
      <Ionicons name={icon} size={18} color="#0f2044" />
      <Text className="text-navy text-sm font-medium">{label}</Text>
    </Pressable>
  );
}

function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
