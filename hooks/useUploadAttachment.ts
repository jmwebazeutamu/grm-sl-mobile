import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';

export interface PickedAsset {
  uri: string;
  name: string;
  mimeType: string;
}

export function useUploadAttachment(id: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ asset, description }: { asset: PickedAsset; description?: string }) => {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      } as unknown as Blob);
      if (description) form.append('description', description);

      const res = await api.post(`/grievances/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d,
      });
      return res.data as { id: number; original_name: string; size_bytes: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grievance', id] });
    },
  });
}

export async function pickFromCamera(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
  return assetFromResult(r);
}

export async function pickFromLibrary(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
  return assetFromResult(r);
}

function assetFromResult(r: ImagePicker.ImagePickerResult): PickedAsset | null {
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  const uriExt = a.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return {
    uri: a.uri,
    name: a.fileName ?? `photo-${Date.now()}.${uriExt}`,
    mimeType: a.mimeType ?? (uriExt === 'png' ? 'image/png' : 'image/jpeg'),
  };
}
