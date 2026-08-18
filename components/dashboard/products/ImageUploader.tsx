'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
}

export default function ImageUploader({ currentImageUrl, onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImageUrl || '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      
      // Validar tamaño máximo (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy pesada. El límite es de 2MB.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir a Supabase Storage (en el bucket "productos")
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage.from('productos').getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      setPreview(publicUrl);
      onUploadComplete(publicUrl);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      alert('Hubo un error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">Imagen del Producto</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <Image 
            src={preview} 
            alt="Vista previa" 
            width={64} 
            height={64} 
            className="w-16 h-16 object-cover rounded-lg border border-gray-200" 
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            Sin foto
          </div>
        )}
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
          />
          {uploading && <p className="text-xs text-blue-600 mt-1">Subiendo imagen...</p>}
        </div>
      </div>
    </div>
  );
}